export type Day = {
  id: number;
  label: string;
  date: string;
  sort_order: number;
};
export type Room = { id: number; name: string; sort_order: number };
export type Speaker = { id: number; name: string; bio: string };
export type Talk = {
  id: number;
  day_id: number;
  title: string;
  description: string;
  topic: string;
  starts_at: string;
  ends_at: string;
  room: Room;
  speaker: Speaker;
};
export type Conference = {
  name: string;
  timezone: "Europe/Moscow";
  is_demo: boolean;
  demo_notice: string;
  days: Day[];
  rooms: Room[];
};
export type Conflict = { talk_id: number; conflicting_talk_ids: number[] };
export type Program = {
  talks: Talk[];
  conflicts: Conflict[];
  selected_count: number;
  conflicting_talk_count: number;
};
export type ApiError = {
  error: {
    code: string;
    message: string;
    details: { field: string; message: string }[];
  };
};
