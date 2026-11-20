import { test, expect } from "@playwright/test";
import type { Talk } from "../lib/types";
test("реальный backend: cookie, выбор, конфликты, идемпотентность и изоляция", async ({
  page,
  context,
  browser,
}) => {
  test.skip(
    process.env.REAL_API !== "1",
    "Требуется запущенный backend и REAL_API=1",
  );
  await page.goto("/program");
  await expect(
    page.getByRole("button", { name: "В мою программу" }).first(),
  ).toBeEnabled();
  const response = await page.request.get("/api/talks");
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: Talk[] };
  const pair = items.flatMap((a) =>
    items
      .filter(
        (b) =>
          a.id < b.id && a.starts_at < b.ends_at && b.starts_at < a.ends_at,
      )
      .map((b) => [a, b]),
  );
  expect(pair.length).toBeGreaterThan(0);
  const [a, b] = pair[0];
  const article = (title: string) =>
    page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await page.getByRole("button", { name: a.title, exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(a.description);
  await page.keyboard.press("Escape");
  await article(a.title)
    .getByRole("button", { name: "В мою программу" })
    .click();
  await expect(article(a.title).getByText("✓ В программе")).toBeVisible();
  await article(b.title)
    .getByRole("button", { name: "В мою программу" })
    .click();
  await expect(
    page.getByText("Доклад добавлен. Есть пересечение по времени"),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Моя программа/ })
    .click();
  await expect(page.getByText("докладов с пересечениями")).toContainText("2");
  await expect(page.getByText(/Пересекается с докладом/)).toHaveCount(2);
  await article(b.title)
    .getByRole("button", { name: "Убрать из программы" })
    .click();
  await expect(page.getByText("докладов с пересечениями")).toContainText("0");
  await page.reload();
  await expect(page.getByText("докладов выбрано")).toContainText("1");
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === "ad_session");
  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  const persisted = await page.request.get("/api/me/program");
  expect(persisted.headers()["cache-control"]).toContain("no-store");
  expect((await persisted.json()).talks.map((t: Talk) => t.id)).toEqual([a.id]);
  const duplicate = await page.request.put(`/api/me/program/talks/${a.id}`, {
    headers: { Origin: "http://localhost:3000" },
  });
  expect(duplicate.ok()).toBe(true);
  expect((await duplicate.json()).selected_count).toBe(1);
  const adjacent = items.find((t) => t.starts_at === a.ends_at);
  expect(adjacent).toBeDefined();
  const adjacentResponse = await page.request.put(
    `/api/me/program/talks/${adjacent!.id}`,
    { headers: { Origin: "http://localhost:3000" } },
  );
  expect(adjacentResponse.ok()).toBe(true);
  expect((await adjacentResponse.json()).conflicting_talk_count).toBe(0);
  const isolated = await browser.newContext();
  const other = await isolated.newPage();
  await other.goto("http://localhost:3000/my-program");
  await expect(
    other.getByRole("heading", { name: "Вы пока не выбрали доклады" }),
  ).toBeVisible();
  await isolated.close();
  for (const id of [a.id, adjacent!.id]) {
    const removed = await page.request.delete(`/api/me/program/talks/${id}`, {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(removed.status()).toBe(204);
  }
});
