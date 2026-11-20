"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Conference, Talk } from "@/lib/types";
import { sortTalks, time } from "@/lib/format";
import { ProgramStatus, useProgram } from "./program-provider";
import { TalkCard } from "./talk-card";
import { TalkDialog } from "./talk-dialog";
export function Schedule({ personal = false }: { personal?: boolean }) {
  const { program, ready, syncing } = useProgram();
  const [conference, setConference] = useState<Conference | null>(null);
  const [conferenceError, setConferenceError] = useState("");
  const [conferenceAttempt, setConferenceAttempt] = useState(0);
  const [dayId, setDayId] = useState<number | null>(null);
  const [room, setRoom] = useState("");
  const [result, setResult] = useState<{ key: string; items: Talk[] } | null>(
    null,
  );
  const [listError, setListError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [dialogId, setDialogId] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    api
      .conference()
      .then((c) => {
        if (active) setConference(c);
      })
      .catch((e) => {
        if (active) setConferenceError(e.message);
      });
    return () => {
      active = false;
    };
  }, [conferenceAttempt]);
  const days = [...(conference?.days ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
  const day = dayId ?? days[0]?.id;
  const key = `${day}:${room}:${attempt}`;
  useEffect(() => {
    if (personal || day === undefined) return;
    const controller = new AbortController();
    api
      .talks(day, room, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, items: data.items });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setListError({ key, message: e.message });
      });
    return () => controller.abort();
  }, [personal, day, room, key]);
  const loading = personal
    ? !ready && syncing
    : day !== undefined && result?.key !== key && listError?.key !== key;
  const items = sortTalks(
    personal
      ? ready
        ? (program?.talks.filter((t) => t.day_id === day) ?? [])
        : []
      : result?.key === key
        ? result.items
        : [],
  );
  const grouped = items.reduce<Record<string, Talk[]>>((acc, talk) => {
    (acc[talk.starts_at] ??= []).push(talk);
    return acc;
  }, {});
  return (
    <main id="main" className="page">
      <p className="eyebrow">ВАШ КОНФЕРЕНЦ-ДЕНЬ, ВАШ ВЫБОР</p>
      <div className="page-heading">
        <div>
          <h1>{personal ? "Моя программа" : "Программа"}</h1>
          <p className="lead">
            {personal
              ? "Всё, что вы хотите услышать, — в одном месте."
              : "Найдите свои темы. Выберите доклады. Соберите свой день."}
          </p>
        </div>
        <span className="timezone">МСК · UTC+3</span>
      </div>
      <p className="demo-notice">
        {conference?.is_demo
          ? conference.demo_notice
          : "Демонстрационная программа. Не является официальным расписанием Analyst Days"}
      </p>
      <ProgramStatus />
      {personal && ready && program && (
        <div className="stats">
          <p>
            <strong>{program.selected_count}</strong> докладов выбрано
          </p>
          <p className={program.conflicting_talk_count ? "conflict-label" : ""}>
            <strong>{program.conflicting_talk_count}</strong> докладов с
            пересечениями
          </p>
        </div>
      )}
      {personal && (
        <p className="storage-note">
          Программа сохраняется в этом браузере. После очистки данных браузера
          доступ к ней потеряется. Срок хранения выбора — 30 дней.
        </p>
      )}
      {!conference &&
        (conferenceError ? (
          <div className="message error" role="alert">
            <p>{conferenceError}</p>
            <button
              className="button secondary"
              onClick={() => {
                setConferenceError("");
                setConferenceAttempt((n) => n + 1);
              }}
            >
              Повторить загрузку программы
            </button>
          </div>
        ) : (
          <p role="status">Загружаем дни и залы…</p>
        ))}
      {conference && (
        <>
          <div className="filters">
            <div className="day-tabs" aria-label="День конференции">
              {days.map((d) => (
                <button
                  key={d.id}
                  aria-pressed={day === d.id}
                  onClick={() => setDayId(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {!personal && (
              <div className="room-filter">
                <label htmlFor="room-filter">Зал</label>
                <select
                  id="room-filter"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                >
                  <option value="">Все залы</option>
                  {[...conference.rooms]
                    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
                    .map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          {loading ? (
            <div className="loading" role="status">
              <span className="spinner" />
              Загружаем доклады…
            </div>
          ) : !personal && listError?.key === key ? (
            <div className="message error" role="alert">
              <p>{listError.message}</p>
              <button
                className="button secondary"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Повторить загрузку докладов
              </button>
            </div>
          ) : personal && !ready ? (
            <p>Выбор пока не синхронизирован с сервером.</p>
          ) : items.length === 0 ? (
            <section className="empty">
              <span className="empty-symbol">＋</span>
              <h2>
                {personal
                  ? program?.selected_count
                    ? "На этот день доклады не выбраны"
                    : "Вы пока не выбрали доклады"
                  : "В этом зале пока нет докладов"}
              </h2>
              <p>
                {personal
                  ? "Откройте программу и добавьте интересные темы."
                  : "Попробуйте другой день или посмотрите все залы."}
              </p>
              {personal ? (
                <Link className="button" href="/program">
                  Открыть программу
                </Link>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => setRoom("")}
                >
                  Показать все залы
                </button>
              )}
            </section>
          ) : (
            <div className="schedule-list">
              {Object.entries(grouped).map(([start, talks]) => (
                <section className="time-group" key={start}>
                  <h2 className="time-heading">
                    {time(start)}
                    <span />{" "}
                  </h2>
                  <div className="talks">
                    {talks.map((t) => (
                      <TalkCard
                        key={t.id}
                        talk={t}
                        open={setDialogId}
                        detailed={personal}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
      {dialogId !== null && (
        <TalkDialog
          id={dialogId}
          days={days}
          close={() => setDialogId(null)}
          open={setDialogId}
        />
      )}
    </main>
  );
}
