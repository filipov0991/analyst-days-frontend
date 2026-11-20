"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { api, initializeProgram } from "@/lib/api";
import type { Program } from "@/lib/types";
function useProgramState() {
  const [program, setProgram] = useState<Program | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [syncing, setSyncing] = useState(true);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    initializeProgram()
      .then((p) => {
        if (active) {
          setProgram(p);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setSyncing(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function retry() {
    if (lock.current) return;
    lock.current = true;
    setSyncing(true);
    setError("");
    setReady(false);
    try {
      setProgram(await initializeProgram());
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setSyncing(false);
    }
  }
  async function toggle(id: number) {
    if (lock.current || !ready || !program) return;
    lock.current = true;
    setBusy(id);
    setError("");
    setNotice("");
    const selected = program.talks.some((t) => t.id === id);
    try {
      let next: Program;
      if (selected) {
        await api.remove(id);
        next = await api.program();
      } else next = await api.add(id);
      setProgram(next);
      setNotice(
        selected
          ? "Доклад удалён из программы."
          : next.conflicts.some((c) => c.talk_id === id)
            ? "Доклад добавлен. Есть пересечение по времени"
            : "Доклад добавлен в вашу программу.",
      );
    } catch (e) {
      setReady(false);
      setError(`${(e as Error).message} Проверяем сохранённый выбор…`);
      setSyncing(true);
      try {
        setProgram(await api.program());
        setReady(true);
        setError(
          `${(e as Error).message} Выбор синхронизирован с сервером. Проверьте результат перед повтором.`,
        );
      } catch {
        setError(
          "Не удалось подтвердить сохранённый выбор. Повторите синхронизацию перед изменением программы.",
        );
      } finally {
        setSyncing(false);
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return { program, ready, busy, error, notice, syncing, retry, toggle };
}
const Context = createContext<ReturnType<typeof useProgramState> | null>(null);
export function ProgramProvider({ children }: { children: ReactNode }) {
  const state = useProgramState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useProgram() {
  const value = useContext(Context);
  if (!value) throw new Error("ProgramProvider missing");
  return value;
}
export function ProgramStatus() {
  const { error, notice, syncing, ready, retry } = useProgram();
  return (
    <div className="status-area" aria-live="polite" aria-atomic="true">
      {syncing && <p className="message">Синхронизируем вашу программу…</p>}
      {error && (
        <div className="message error">
          <p>{error}</p>
          {!ready && (
            <button
              className="button secondary"
              disabled={syncing}
              onClick={retry}
            >
              Повторить синхронизацию
            </button>
          )}
        </div>
      )}
      {notice && (
        <p className="message success">
          {notice} <Link href="/my-program">Моя программа</Link>
        </p>
      )}
    </div>
  );
}
