"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page empty">
      <h1>Не удалось открыть страницу</h1>
      <p>Попробуйте загрузить её ещё раз.</p>
      <button className="button" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
