"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgram } from "./program-provider";
export function Header() {
  const path = usePathname();
  const { program, ready } = useProgram();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Analyst Days — главная">
          <span className="brand-mark">ad</span>Analyst Days
          <span className="brand-caption">моя программа</span>
        </Link>
        <nav aria-label="Основная навигация">
          {[
            ["/", "Главная"],
            ["/program", "Программа"],
            ["/my-program", "Моя программа"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {label}
              {href === "/my-program" && (
                <span
                  className="count"
                  aria-label={
                    ready
                      ? `${program?.selected_count ?? 0} выбрано`
                      : "Выбор не синхронизирован"
                  }
                >
                  {ready ? (program?.selected_count ?? 0) : "—"}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <span>Analyst Days · личная программа</span>
      <span>Демонстрационный проект · время МСК (UTC+3)</span>
    </footer>
  );
}
