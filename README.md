# Analyst Days — моя программа

Frontend демонстрационного приложения: просмотр докладов, личная программа и предупреждения о пересечениях. Это не официальный сервис или расписание Analyst Days.

Next.js App Router, React, TypeScript, Tailwind CSS. Отдельный backend предоставляет доклады, анонимные сессии, сохранение в БД и расчёт конфликтов. Frontend не хранит выбор в localStorage и не рассчитывает пересечения.

## Установка и запуск

Нужны Node.js 22 LTS (или совместимая более новая LTS), npm и отдельно запущенный backend.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Открыть **http://localhost:3000**. Для мутаций используйте именно `localhost`, не `127.0.0.1`: backend проверяет Origin. Backend по умолчанию: http://127.0.0.1:8000, Swagger: http://localhost:8000/docs.

Backend-репозиторий располагается рядом: `../analyst-days-backend`. Запускайте его по собственному README; этот репозиторий backend не запускает и не изменяет. [Backend на GitHub](https://github.com/filipov0991/analyst-days-backend).

## Настройка API

`.env.local` (не коммитится):

```dotenv
BACKEND_URL=http://127.0.0.1:8000
```

`BACKEND_URL` — серверная переменная, без `NEXT_PUBLIC`, без суффикса `/api`. После изменения перезапустите dev-сервер; production-сборку пересоберите, поскольку rewrites фиксируются при сборке.

Все запросы клиента идут на same-origin `/api/*`. Next.js rewrite передаёт запросы на `${BACKEND_URL}/api/*`, включая Cookie, Set-Cookie и Origin. Клиент использует `credentials: same-origin`, `cache: no-store`; персональные ответы дополнительно получают `Cache-Control: no-store`. API-контракт находится в [ТЗ](docs/frontend-spec.md).

Backend должен разрешать `http://localhost:3000` в `ALLOWED_ORIGINS`. Cookie `ad_session` устанавливает только backend: HttpOnly, SameSite=Lax, Path=/, 30 дней. Токен не читается JS. В локальном HTTP окружении backend должен использовать cookie без Secure.

При использовании Swagger/curl для PUT/DELETE требуется явный разрешённый Origin. Пример (cookie-jar сначала создаётся GET):

```sh
curl -c /tmp/ad-cookies.txt http://localhost:3000/api/me/program
curl -b /tmp/ad-cookies.txt -c /tmp/ad-cookies.txt \
  -H 'Origin: http://localhost:3000' -X PUT \
  http://localhost:3000/api/me/program/talks/1
curl -b /tmp/ad-cookies.txt -H 'Origin: http://localhost:3000' \
  -X DELETE http://localhost:3000/api/me/program/talks/1
```

Без backend показываются сообщения об ошибке и кнопки повтора. Автоматической подмены сервера моками нет. 20 демонстрационных докладов, их даты и спикеры приходят из backend seed; условные даты не показываются как даты реальной конференции. Время отображается в Europe/Moscow.

## Команды проверки

```sh
npm run build
npm run typecheck
npm run lint
npm run test:e2e
REAL_API=1 npm run test:e2e
```

Playwright использует установленный Google Chrome (`channel: chrome`), запускает dev-сервер при необходимости. Если Chrome отсутствует, установите его либо выполните `npx playwright install chrome`. UI-тесты перехватывают API только внутри браузерного теста; фикстуры не включены в приложение. `REAL_API=1` дополнительно запускает настоящий интеграционный сценарий через Next.js proxy и создаёт отдельные анонимные тестовые сессии. Запускать против локального демонстрационного backend. Проверка переживания перезапуска backend выполняется отдельно его владельцем.

```sh
npm run build
npm start
```

`npm start` копирует статические ресурсы в standalone и запускает `.next/standalone/server.js`.

Production-сервер также открывайте по http://localhost:3000. Порт 3000 должен быть свободен.

## Docker (для будущего размещения)

```sh
docker build --build-arg BACKEND_URL=http://host.docker.internal:8000 -t analyst-days-frontend .
docker run --rm -p 3000:3000 analyst-days-frontend
```

На Linux при доступе к backend хоста добавьте `--add-host=host.docker.internal:host-gateway`. Для отдельного backend-контейнера передайте его внутренний адрес при сборке. Это Node-сервер с proxy, не статический экспорт. Docker-сборка пока не проверена. Публикация и push в рамках этого этапа не выполняются.

## Текущий статус

MVP реализован. Production build, TypeScript, ESLint и 10 браузерных frontend-тестов прошли. Совместная проверка с реальным backend завершена: cookie, конфликты, сохранение, перезапуск и восстановление после отключения проверены. [Отчёт интеграции](docs/integration-checks.md). Подробности — в [отчёте](docs/ui-checks.md).

## Структура

- `app/` — главная, программа, личная программа, общие стили и оболочка.
- `components/` — единое состояние выбора, карточки, фильтры, диалог.
- `lib/api.ts`, `lib/types.ts` — типизированный API v1 и единая обработка ошибок.
- `tests/` — браузерные UI-тесты с явными фикстурами и опциональная реальная интеграция.
- `docs/` — требования и материалы проверки.

## Документы

- [Контекст v0](docs/context-v0.md)
- [Техническое задание](docs/frontend-spec.md)
- [Фактический контекст v1](docs/context-v1.md)
- [Отчёт UI-проверок](docs/ui-checks.md)
- [Значимые промпты](docs/prompts.md)
