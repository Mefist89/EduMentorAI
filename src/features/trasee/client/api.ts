import type { CourseDetail } from "../shared/rank";
import type {
  CoverageResponse, Network,
  SearchRequest,
  SearchResponse,
} from "../shared/types";

export interface Api {
  search(req: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
  course(id: string): Promise<CourseDetail>;
  courses(ids: string[]): Promise<CourseDetail[]>;
  coverage(simulate: boolean): Promise<CoverageResponse>;
  network(): Promise<Network>;
  state(): Promise<{
    done: { id: string; title: string }[];
    courses: number;
    providers: number;
  }>;
  complete(id: string, completed: boolean): Promise<{ ok: boolean }>;
  mode: "server" | "demo";
}

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (data as { error?: string }).error ?? `Eroare ${res.status}`,
    );
  return data as T;
}

export const httpApi: Api = {
  mode: "server",
  search: (req, signal) =>
    fetch("/api/trasee/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
    }).then((r) => json<SearchResponse>(r)),
  course: (id) =>
    fetch(`/api/trasee/courses/${encodeURIComponent(id)}`).then((r) =>
      json<CourseDetail>(r),
    ),
  courses: (ids) =>
    fetch(
      `/api/trasee/courses?ids=${ids.map(encodeURIComponent).join(",")}`,
    ).then((r) => json<CourseDetail[]>(r)),
  coverage: (simulate) =>
    fetch(`/api/trasee/coverage${simulate ? "?simulate=1" : ""}`).then((r) =>
      json<CoverageResponse>(r),
    ),
  network: () => fetch("/api/trasee/network").then(json<Network>),
  state: () => fetch("/api/trasee/state").then((r) => json(r)),
  complete: (courseId, completed) =>
    fetch("/api/trasee/completed", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, completed }),
    }).then((r) => json(r)),
};
