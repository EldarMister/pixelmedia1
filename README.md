# Pixe1.media CRM

Операционная CRM для медиастудии: React/Vite frontend, Express REST API и PostgreSQL.

## Локальный запуск

```bash
npm install
npm run dev
```

Без `DATABASE_URL` локальная версия использует `localStorage fallback`, чтобы можно было проверить интерфейс.

## Реальная база данных

1. Создайте PostgreSQL базу.
2. Скопируйте `.env.example` в `.env`.
3. Укажите `DATABASE_URL`.
4. Примените схему:

```bash
npm run db:migrate
```

При запуске backend также применяет `db/init.sql`, если `AUTO_MIGRATE` не равен `false`.

## Production / Railway

Для production обязательно задайте:

```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
AUTO_MIGRATE=true
VITE_ENABLE_LOCAL_FALLBACK=false
```

На Railway:

1. Создайте PostgreSQL plugin/service.
2. Подключите переменную `DATABASE_URL` к web service.
3. Build command: `npm run build`
4. Start command: `npm start`

Backend отдаёт собранный frontend из `dist`, поэтому отдельный frontend service не нужен.

Если `DATABASE_URL` отсутствует в production/Railway, приложение завершит запуск с ошибкой. Это сделано намеренно, чтобы CRM не начала работать с временными локальными данными.
