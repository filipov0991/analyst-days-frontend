import type { Talk } from "./types";
const formatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  hour: "2-digit",
  minute: "2-digit",
});
export const time = (date: string) => formatter.format(new Date(date));
export const interval = (talk: Talk) =>
  `${time(talk.starts_at)}–${time(talk.ends_at)}`;
export const sortTalks = (talks: Talk[]) =>
  [...talks].sort(
    (a, b) =>
      Date.parse(a.starts_at) - Date.parse(b.starts_at) ||
      a.room.sort_order - b.room.sort_order ||
      a.id - b.id,
  );
