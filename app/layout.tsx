import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ProgramProvider } from "@/components/program-provider";
import { Header, Footer } from "@/components/shell";
export const metadata: Metadata = {
  title: "Analyst Days: моя программа",
  description:
    "Соберите личную программу, выбирайте доклады и замечайте пересечения. Демонстрационный проект.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="skip-link">
          Перейти к содержимому
        </a>
        <ProgramProvider>
          <Header />
          {children}
          <Footer />
        </ProgramProvider>
      </body>
    </html>
  );
}
