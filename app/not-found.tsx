import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="page empty">
      <h1>Страница не найдена</h1>
      <Link className="button" href="/program">
        Открыть программу
      </Link>
    </main>
  );
}
