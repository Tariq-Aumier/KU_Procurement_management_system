# Kabul University Procurement API

Laravel 12 REST backend for the Kabul University Procurement Management System. It uses MySQL, bearer-token authentication, role checks, audit logs, workflow endpoints, upload storage, and API endpoints under `/api/v1`.

## Setup

1. Create the MySQL database: `CREATE DATABASE kabul_procurement CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. In `.env`, set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for MySQL. Set `APP_URL` to the API address and set `APP_ENV=production`, `APP_DEBUG=false` before deployment.
3. Install dependencies: `composer install --no-dev --optimize-autoloader`.
4. Generate the app key if needed: `php artisan key:generate`.
5. Run the schema and initial users: `php artisan migrate --seed`.
6. Make storage available: `php artisan storage:link`.
7. Development server: `php artisan serve`. For queue-backed jobs in production, run `php artisan queue:work` under Supervisor.

Initial development accounts: `admin / Admin@123` and `manager / Manager@123`. Change both passwords immediately.

## Frontend integration

1. In the Vite frontend create `.env`: `VITE_API_URL=http://127.0.0.1:8000/api/v1`.
2. Replace the frontend's local-storage `login` call with `POST ${VITE_API_URL}/auth/login` using `{ username, password }`.
3. Store `accessToken` in memory (or a secure session mechanism) and send `Authorization: Bearer <accessToken>` on every subsequent API request.
4. Call `GET /me` during startup. Replace the existing `AppContext` local-storage CRUD methods with the matching endpoints below.

## Primary endpoints

- Authentication: `POST /auth/login`, `POST /auth/logout`, `GET/PATCH /me`, `POST /me/change-password`
- Resources: `GET/POST/PATCH/DELETE /companies`, `/vendors`, `/offices`, `/office-categories`, `/orders`, `/rfqs`, `/contracts`, `/inventory-locations`, `/inventory-items`, `/users`
- Procurement: `/orders/{id}/items`, `/orders/{id}/submit|approve|start|complete|cancel`, `/rfqs/{id}/items`, `/rfqs/{id}/publish|close`, `/rfqs/{id}/vendors`, `/rfqs/{id}/bids`, `/rfqs/{id}/committee`, `/rfqs/{id}/recommend-award`, `/bids/{id}/evaluations`, `/awards/{id}/approve`, `/contracts/{id}/progress`
- Operations: `/inventory-items/{id}/movements`, `/inventory/alerts`, `/documents`, `/dashboard`, `/audit-logs`, `/notifications`

## Production checklist

- Use PHP 8.2+, MySQL 8+, HTTPS, a strong unique `APP_KEY`, and a restricted database user.
- Set `APP_ENV=production`, `APP_DEBUG=false`, configure a real mail provider, filesystem/object storage, cache, queue worker, scheduler, backups, and log rotation.
- Configure CORS at the web server/proxy for the frontend origin only. Never expose `.env`, `storage`, or MySQL to the public internet.
- Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan optimize` after deployment.
