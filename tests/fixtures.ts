import type { Conference, Program, Talk } from "../lib/types";
// UI test fixtures only. Production always reads the separate backend.
// All conditional dates are centralized here, never displayed as conference dates.
const dates = ["2030-01-01", "2030-01-02"];
export const conference: Conference = {
  name: "Analyst Days",
  timezone: "Europe/Moscow",
  is_demo: true,
  demo_notice:
    "Демонстрационная программа. Не является официальным расписанием Analyst Days",
  days: dates.map((date, index) => ({
    id: index + 1,
    label: `День ${index + 1}`,
    date,
    sort_order: index + 1,
  })),
  rooms: ["Зал A", "Зал B", "Зал C"].map((name, index) => ({
    id: index + 1,
    name,
    sort_order: index + 1,
  })),
};
const titles = [
  "Требования без потерь",
  "API как продукт",
  "Архитектура решений",
  "Качество данных",
  "Интервью с пользователями",
  "Карта процессов",
  "ИИ в работе аналитика",
  "Событийные системы",
  "Понятная документация",
  "Метрики продукта",
  "Проверка гипотез",
  "Моделирование предметной области",
  "Контракты интеграций",
  "Данные для решений",
  "Границы системы",
  "Язык требований",
  "Исследование поведения",
  "Практика прототипирования",
  "Путь к архитектуре",
  "Работа с неопределённостью",
];
const slots = [
  ["06:00", "06:40"],
  ["06:00", "06:40"],
  ["06:20", "07:00"],
  ["06:10", "06:30"],
  ["06:40", "07:20"],
  ["08:00", "08:40"],
  ["08:00", "08:40"],
  ["09:00", "09:40"],
  ["10:00", "10:40"],
  ["11:00", "11:40"],
];
export const talks: Talk[] = titles.map((title, i) => ({
  id: i + 1,
  day_id: i < 10 ? 1 : 2,
  title,
  description: `Демонстрационный доклад «${title}»: практические подходы, примеры и обсуждение решений.`,
  topic: ["Требования", "API", "Архитектура", "Данные", "Исследования"][i % 5],
  starts_at: `${dates[i < 10 ? 0 : 1]}T${slots[i % 10][0]}:00Z`,
  ends_at: `${dates[i < 10 ? 0 : 1]}T${slots[i % 10][1]}:00Z`,
  room: conference.rooms[i % 3],
  speaker: {
    id: i + 1,
    name: `Демо-спикер ${i + 1}`,
    bio: "Вымышленный участник демонстрационной программы.",
  },
}));
export const emptyProgram: Program = {
  talks: [],
  conflicts: [],
  selected_count: 0,
  conflicting_talk_count: 0,
};
// Explicit response fixtures, not a client-side conflict implementation.
export function selection(ids: number[]): Program {
  const conflicting = ids.includes(1) && ids.includes(2);
  return {
    talks: talks.filter((t) => ids.includes(t.id)),
    selected_count: ids.length,
    conflicting_talk_count: conflicting ? 2 : 0,
    conflicts: conflicting
      ? [
          { talk_id: 1, conflicting_talk_ids: [2] },
          { talk_id: 2, conflicting_talk_ids: [1] },
        ]
      : [],
  };
}
