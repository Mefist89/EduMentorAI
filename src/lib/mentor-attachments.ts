export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 3_000_000;
export const ATTACHMENT_ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg";
const types: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};
export type MentorAttachment = { name: string; mime: string; data: string };
export function attachmentMime(name: string): string | null {
  return types[name.toLowerCase().split(".").at(-1) ?? ""] ?? null;
}
export function attachmentBytes(file: MentorAttachment): number {
  return file.data.length / 4 * 3 - (file.data.endsWith("==") ? 2 : file.data.endsWith("=") ? 1 : 0);
}

// Both the browser and server validate the payload; browser accept/MIME are hints only.
export function parseAttachments(value: unknown): MentorAttachment[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) return null;
  const files: MentorAttachment[] = [];
  let total = 0;
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim() || item.name.length > 180 || /[\x00-\x1f\\/]/.test(item.name) ||
      !attachmentMime(item.name) || item.mime !== attachmentMime(item.name) || typeof item.data !== "string" || !item.data || item.data.length > 4_000_000 || item.data.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(item.data)) return null;
    const file = { name: item.name.trim(), mime: item.mime as string, data: item.data };
    total += attachmentBytes(file);
    if (total > MAX_ATTACHMENT_BYTES) return null;
    const header = atob(file.data.slice(0, 16));
    if ((file.mime === "application/pdf" && !header.startsWith("%PDF-")) ||
      (file.mime === "image/png" && !header.startsWith("\x89PNG\r\n\x1a\n")) ||
      (file.mime === "image/jpeg" && !header.startsWith("\xff\xd8\xff")) ||
      (file.name.toLowerCase().endsWith(".docx") && !header.startsWith("PK\x03\x04"))) return null;
    files.push(file);
  }
  return files;
}
