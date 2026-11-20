import type { ApiError, Conference, Program, Talk } from "./types";
export class RequestError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = "NETWORK_ERROR",
  ) {
    super(message);
  }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new RequestError(
      "Не удалось связаться с сервером. Проверьте подключение и повторите.",
    );
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = (data as ApiError | null)?.error;
    throw new RequestError(
      detail?.message || "Сервер временно недоступен. Попробуйте ещё раз.",
      response.status,
      detail?.code || "PROXY_ERROR",
    );
  }
  if (data === null)
    throw new RequestError(
      "Сервер вернул некорректный ответ.",
      response.status,
      "INVALID_RESPONSE",
    );
  return data as T;
}
export const api = {
  conference: () => request<Conference>("/conference"),
  talks: (day: number, room: string, signal?: AbortSignal) =>
    request<{ items: Talk[]; total: number }>(
      `/talks?day_id=${day}${room ? `&room_id=${room}` : ""}`,
      { signal },
    ),
  talk: (id: number, signal?: AbortSignal) =>
    request<Talk>(`/talks/${id}`, { signal }),
  program: () => request<Program>("/me/program"),
  add: (id: number) =>
    request<Program>(`/me/program/talks/${id}`, { method: "PUT" }),
  remove: (id: number) =>
    request<void>(`/me/program/talks/${id}`, { method: "DELETE" }),
};
// One browser-side in-flight initialization, also across Strict Mode remounts.
let initialization: Promise<Program> | undefined;
export function initializeProgram() {
  initialization ??= api.program().finally(() => {
    initialization = undefined;
  });
  return initialization;
}
