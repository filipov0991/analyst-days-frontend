"use client";
import type { Talk } from "@/lib/types";
import { interval } from "@/lib/format";
import { useProgram } from "./program-provider";
export function SelectionButton({ talk }: { talk: Talk }) {
  const { program, ready, busy, toggle } = useProgram();
  const selected = !!program?.talks.some((t) => t.id === talk.id);
  return (
    <button
      className={`button ${selected ? "secondary selected" : ""}`}
      aria-pressed={selected}
      disabled={!ready || busy !== null}
      onClick={() => toggle(talk.id)}
    >
      {busy === talk.id
        ? "Сохраняем…"
        : selected
          ? "Убрать из программы"
          : "В мою программу"}
    </button>
  );
}
export function ConflictList({
  talk,
  open,
}: {
  talk: Talk;
  open: (id: number) => void;
}) {
  const { program, ready } = useProgram();
  const ids = ready
    ? (program?.conflicts.find((c) => c.talk_id === talk.id)
        ?.conflicting_talk_ids ?? [])
    : [];
  return (
    ids.length > 0 && (
      <ul className="conflict-list">
        {ids.map((id) => {
          const other = program?.talks.find((t) => t.id === id);
          return (
            other && (
              <li key={id}>
                ⚠ Пересекается с докладом «
                <button className="text-button" onClick={() => open(id)}>
                  {other.title}
                </button>
                » — {interval(other)}, {other.room.name}
              </li>
            )
          );
        })}
      </ul>
    )
  );
}
export function TalkCard({
  talk,
  open,
  detailed = false,
}: {
  talk: Talk;
  open: (id: number) => void;
  detailed?: boolean;
}) {
  const { program, ready } = useProgram();
  const selected = ready && program?.talks.some((t) => t.id === talk.id);
  const conflict =
    ready && program?.conflicts.some((c) => c.talk_id === talk.id);
  return (
    <article className={`talk-card ${selected ? "is-selected" : ""}`}>
      <div className="talk-meta">
        <strong>{interval(talk)}</strong>
        <span>{talk.room.name}</span>
        {selected && <span className="selected-label">✓ В программе</span>}
      </div>
      <div className="talk-content">
        <span className="topic">{talk.topic}</span>
        <h3>
          <button className="talk-title" onClick={() => open(talk.id)}>
            {talk.title}
          </button>
        </h3>
        <p className="speaker">{talk.speaker.name}</p>
        {conflict && (
          <p className="conflict-label">⚠ Есть пересечение по времени</p>
        )}
        {detailed && <ConflictList talk={talk} open={open} />}
      </div>
      <div className="card-action">
        <SelectionButton talk={talk} />
      </div>
    </article>
  );
}
