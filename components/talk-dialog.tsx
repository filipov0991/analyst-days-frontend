"use client";
import { useEffect, useRef, useState } from "react";
import type { Day, Talk } from "@/lib/types";
import { api } from "@/lib/api";
import { interval } from "@/lib/format";
import { ConflictList, SelectionButton } from "./talk-card";
export function TalkDialog({
  id,
  days,
  close,
  open,
}: {
  id: number;
  days: Day[];
  close: () => void;
  open: (id: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api
      .talk(id, controller.signal)
      .then(setTalk)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [id, attempt]);
  const current = talk?.id === id ? talk : null;
  return (
    <dialog
      ref={dialog}
      className="talk-dialog"
      aria-labelledby="dialog-title"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-inner">
        <button
          autoFocus
          className="close-button"
          aria-label="Закрыть подробности"
          onClick={close}
        >
          ×
        </button>
        {current ? (
          <>
            <p className="eyebrow">
              {days.find((d) => d.id === current.day_id)?.label} ·{" "}
              {interval(current)} МСК · {current.room.name}
            </p>
            <h2 id="dialog-title">{current.title}</h2>
            <span className="topic">{current.topic}</span>
            <p className="description">{current.description}</p>
            <section className="speaker-block">
              <h3>{current.speaker.name}</h3>
              <p>
                {current.speaker.bio || "Биография спикера пока не добавлена."}
              </p>
            </section>
            <ConflictList
              talk={current}
              open={(next) => {
                setError("");
                open(next);
              }}
            />
            <SelectionButton talk={current} />
          </>
        ) : (
          <>
            <h2 id="dialog-title">Подробности доклада</h2>
            {error ? (
              <div role="alert">
                <p>{error}</p>
                <button
                  className="button"
                  onClick={() => {
                    setError("");
                    setAttempt((a) => a + 1);
                  }}
                >
                  Повторить
                </button>
              </div>
            ) : (
              <p role="status">Загружаем подробности…</p>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
