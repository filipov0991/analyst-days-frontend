import { test, expect, type Page } from "@playwright/test";
import { conference, talks, selection } from "./fixtures";
async function mockApi(page: Page, initial: number[] = []) {
  let ids = [...initial];
  let reads = 0;
  let writes = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (body: unknown) => route.fulfill({ json: body });
    if (path === "/api/conference") return json(conference);
    if (path === "/api/talks") {
      if (url.searchParams.get("room_id") === "3")
        return json({ items: [], total: 0 });
      const items = talks.filter(
        (t) =>
          (!url.searchParams.has("day_id") ||
            t.day_id === Number(url.searchParams.get("day_id"))) &&
          (!url.searchParams.has("room_id") ||
            t.room.id === Number(url.searchParams.get("room_id"))),
      );
      return json({ items, total: items.length });
    }
    if (/^\/api\/talks\/\d+$/.test(path))
      return json(talks.find((t) => t.id === Number(path.split("/").pop())));
    if (path === "/api/me/program") {
      reads++;
      await new Promise((r) => setTimeout(r, 100));
      return json(selection(ids));
    }
    const id = Number(path.split("/").pop());
    writes++;
    await new Promise((r) => setTimeout(r, 150));
    if (method === "PUT") {
      ids = [...new Set([...ids, id])];
      return json(selection(ids));
    }
    if (method === "DELETE") {
      ids = ids.filter((x) => x !== id);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404 });
  });
  return { reads: () => reads, writes: () => writes };
}
const card = (page: Page, title: string) =>
  page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
test("выбор, серверные конфликты, удаление, перезагрузка и пустой день", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await page.goto("/program");
  await expect(
    page.getByRole("button", { name: "В мою программу" }).first(),
  ).toBeEnabled();
  expect(calls.reads()).toBe(1);
  await card(page, talks[0].title)
    .getByRole("button", { name: "В мою программу" })
    .click();
  await expect(
    card(page, talks[0].title).getByText("✓ В программе"),
  ).toBeVisible();
  await card(page, talks[1].title)
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
  await card(page, talks[1].title)
    .getByRole("button", { name: "Убрать из программы" })
    .click();
  await expect(page.getByText("докладов с пересечениями")).toContainText("0");
  await page.reload();
  await expect(page.getByText("докладов выбрано")).toContainText("1");
  await page.getByRole("button", { name: "День 2", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "На этот день доклады не выбраны" }),
  ).toBeVisible();
  expect(calls.writes()).toBe(3);
});
test("диалог, Escape, возврат фокуса, день и пустой фильтр", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/program");
  const title = page.getByRole("button", { name: talks[0].title, exact: true });
  await title.click();
  await expect(page.getByRole("dialog")).toContainText("Вымышленный участник");
  await expect(page.getByRole("dialog")).toContainText("09:00–09:40");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "В мою программу" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Закрыть подробности" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "В мою программу" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Закрыть подробности" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(title).toBeFocused();
  await page.getByLabel("Зал", { exact: true }).selectOption("3");
  await expect(
    page.getByRole("heading", { name: "В этом зале пока нет докладов" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Показать все залы" }).click();
  await expect(title).toBeVisible();
  await page.getByRole("button", { name: "День 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: talks[10].title, exact: true }),
  ).toBeVisible();
  await expect(title).toHaveCount(0);
});
test("недоступный backend: понятная ошибка и повтор", async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 502,
      contentType: "text/html",
      body: "<h1>Bad Gateway</h1>",
    }),
  );
  await page.goto("/program");
  await expect(
    page.getByRole("button", { name: "Повторить синхронизацию" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Повторить загрузку программы" }),
  ).toBeVisible();
  await mockApi(page);
  await page.getByRole("button", { name: "Повторить синхронизацию" }).click();
  await page
    .getByRole("button", { name: "Повторить загрузку программы" })
    .click();
  await expect(
    page.getByRole("button", { name: "В мою программу" }).first(),
  ).toBeEnabled();
});
test("неопределённый PUT синхронизируется, быстрые клики не дублируют запрос", async ({
  page,
}) => {
  const calls = await mockApi(page);
  let mutation = 0;
  await page.route("**/api/me/program/talks/1", async (route) => {
    mutation++;
    await new Promise((r) => setTimeout(r, 350));
    await route.abort();
  });
  await page.goto("/program");
  const add = card(page, talks[0].title).getByRole("button", {
    name: "В мою программу",
  });
  await add.dblclick();
  await expect(
    page.getByText(/Выбор синхронизирован с сервером/),
  ).toBeVisible();
  await expect(add).toBeEnabled();
  expect(mutation).toBe(1);
  expect(calls.reads()).toBe(2);
});
for (const width of [360, 768, 1440])
  test(`адаптивность ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, [1, 2]);
    for (const path of ["/", "/program", "/my-program"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (path !== "/")
        await expect(page.getByRole("article").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/${width}-${path.replaceAll("/", "") || "home"}.png`,
        fullPage: true,
      });
    }
  });
test("провал повторной синхронизации блокирует изменения до успешного повтора", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/program");
  const add = card(page, talks[0].title).getByRole("button", {
    name: "В мою программу",
  });
  await expect(add).toBeEnabled();
  await page.route("**/api/me/program", (route) => route.abort());
  await page.route("**/api/me/program/talks/*", (route) => route.abort());
  await add.click();
  await expect(
    page.getByText(/Не удалось подтвердить сохранённый выбор/),
  ).toBeVisible();
  await expect(add).toBeDisabled();
  await page.unroute("**/api/me/program");
  await page.unroute("**/api/me/program/talks/*");
  await page.getByRole("button", { name: "Повторить синхронизацию" }).click();
  await expect(add).toBeEnabled();
});
test("быстрая смена дня игнорирует запоздалый ответ", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/talks?**", async (route) => {
    const day = Number(
      new URL(route.request().url()).searchParams.get("day_id"),
    );
    await new Promise((r) => setTimeout(r, day === 1 ? 500 : 10));
    const items = talks.filter((t) => t.day_id === day);
    await route.fulfill({ json: { items, total: items.length } });
  });
  await page.goto("/program");
  await page.getByRole("button", { name: "День 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: talks[10].title, exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(600); // allow the intentionally slow old response to arrive
  await expect(
    page.getByRole("button", { name: talks[0].title, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: talks[10].title, exact: true }),
  ).toBeVisible();
});
test("диалог выбранного доклада показывает конфликт и открывает его подробности", async ({
  page,
}) => {
  await mockApi(page, [1, 2]);
  await page.goto("/my-program");
  await card(page, talks[0].title)
    .getByRole("button", { name: talks[0].title, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Пересекается с докладом",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: talks[1].title, exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: talks[1].title, exact: true }),
  ).toBeVisible();
});
