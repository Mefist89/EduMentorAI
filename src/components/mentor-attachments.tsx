"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import type { Locale } from "@/lib/demo";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES, attachmentBytes, attachmentMime, parseAttachments, type MentorAttachment } from "@/lib/mentor-attachments";

function readFile(file: File): Promise<MentorAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mime: attachmentMime(file.name)!, data: String(reader.result).split(",")[1] ?? "" });
    reader.onerror = () => reject(new Error("read"));
    reader.onabort = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export function MentorAttachments({ value, onChange, locale, disabled, onReadingChange }: {
  value: MentorAttachment[]; onChange: (files: MentorAttachment[]) => void; locale: Locale; disabled: boolean; onReadingChange: (reading: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const readingRef = useRef(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  return <div className="mentor-attachments">
    <input ref={input} type="file" accept={ATTACHMENT_ACCEPT} multiple hidden aria-label={t("Selectează fișiere", "Выберите файлы")} onChange={async event => {
      const selected = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = "";
      if (!selected.length || disabled || readingRef.current) return;
      setError("");
      if (value.length + selected.length > MAX_ATTACHMENTS || value.reduce((n, f) => n + attachmentBytes(f), 0) + selected.reduce((n, f) => n + f.size, 0) > MAX_ATTACHMENT_BYTES) {
        setError(t("Maximum 3 fișiere, în total 3 MB.", "Можно прикрепить до 3 файлов общим размером 3 МБ.")); return;
      }
      if (selected.some(f => !attachmentMime(f.name) || !f.size)) { setError(t("Alege PDF, DOCX, TXT, PNG sau JPG care nu este gol.", "Выберите непустой файл PDF, DOCX, TXT, PNG или JPG.")); return; }
      readingRef.current = true; setReading(true); onReadingChange(true);
      try {
        const parsed = parseAttachments([...value, ...await Promise.all(selected.map(readFile))]);
        if (!parsed) throw new Error("format");
        onChange(parsed);
      } catch { setError(t("Fișierul nu a putut fi citit sau formatul său nu corespunde extensiei.", "Не удалось прочитать файл или его содержимое не соответствует формату.")); }
      finally { readingRef.current = false; setReading(false); onReadingChange(false); }
    }} />
    <button type="button" className="mentor-attach-button" disabled={disabled || reading} onClick={() => input.current?.click()}><Paperclip size={16} aria-hidden="true" />{reading ? t("Se citește…", "Чтение…") : t("Atașează fișier", "Прикрепить файл")}</button>
    <p className="mentor-files-hint">PDF, DOCX, TXT, PNG, JPG · {t("max. 3 fișiere, 3 MB în total", "до 3 файлов, всего 3 МБ")}</p>
    {error && <p className="mentor-file-error" role="alert">{error}</p>}
    {value.length > 0 && <><ul className="mentor-file-list">{value.map((file, index) => <li key={`${index}-${file.name}`}><Paperclip size={13} aria-hidden="true" /><span>{file.name} <small>{Math.ceil(attachmentBytes(file) / 1000)} KB</small></span><button type="button" disabled={disabled || reading} aria-label={t(`Elimină ${file.name}`, `Удалить ${file.name}`)} onClick={() => onChange(value.filter((_, i) => i !== index))}><X size={15} aria-hidden="true" /></button></li>)}</ul><p className="mentor-files-hint">{t("Fișierele sunt trimise către OpenAI cu fiecare mesaj până le elimini. Nu sunt publicate pe site.", "Файлы отправляются в OpenAI с каждым сообщением, пока вы их не удалите. На сайте они не публикуются.")}</p></>}
  </div>;
}
