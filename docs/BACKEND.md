# Backend

## Stack
- **API:** Hono (`apps/api`) — runs locally or on AWS Lambda
- **Database:** PostgreSQL + Drizzle ORM (`packages/db`)
- **Storage:** S3 presigned uploads (local file storage fallback for dev)
- **Auth:** Cognito JWT (dev header bypass for local work)
- **Infra:** AWS CDK (`infra/`)

## Local development

### 1. Start Postgres
```bash
npm run db:up
```

### 2. Configure env
```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

### 3. Run migrations
```bash
export DATABASE_URL=postgresql://jsvs:jsvs_dev_password@localhost:5432/jsvs
npm run db:migrate
```

### 4. Start API + web
```bash
npm run dev:api
npm run dev
```

API: http://localhost:4000  
Web: http://localhost:3000

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/session/bootstrap` | Create/sync user + client profile |
| GET | `/v1/me` | Current user |
| GET | `/v1/profiles/me` | Client profile + timeline |
| PATCH | `/v1/profiles/me/stage` | Client updates own stage (limited use) |
| GET | `/v1/profiles` | Staff client list (owner/assistant) |
| GET | `/v1/profiles/:id` | Staff client detail + timeline |
| PATCH | `/v1/profiles/:id/stage` | Staff updates client claim stage |
| GET | `/v1/profiles/:id/documents` | Staff list documents for a client |
| GET | `/v1/staff/stats` | Staff dashboard counts |
| GET | `/v1/staff/documents` | Staff document review queue |
| PATCH | `/v1/staff/documents/:id/status` | Staff update document review status |
| GET | `/v1/staff/documents/:id/download` | Staff presigned download URL |
| GET | `/v1/documents` | List client documents |
| POST | `/v1/documents/presign` | Create upload record + presigned URL |
| POST | `/v1/documents/:id/complete` | Mark upload complete |
| GET | `/v1/documents/:id/download` | Client presigned download URL |

## Web login
- **Client portal:** `/login?portal=client` → `/portal`
- **Staff portal:** `/login?portal=staff` → `/staff` (not linked on public site)
- **Local dev:** choose a demo persona when `NEXT_PUBLIC_DEV_AUTH=true`
- **Production:** Cognito Hosted UI via `/auth/callback` when `NEXT_PUBLIC_COGNITO_DOMAIN` is set

## Local auth bypass
When `DEV_AUTH_BYPASS=true`, send headers:
- `X-User-Sub`
- `X-User-Email`
- `X-User-Role` (`client`, `assistant`, `owner`)
- `X-User-Name`

The web app sends these automatically when `NEXT_PUBLIC_DEV_AUTH=true`.

## AWS deployment
```bash
npm run build:api
cd infra && npm install && npm run deploy
```

CDK provisions: VPC, RDS PostgreSQL, Cognito, S3, KMS, Lambda, API Gateway.

After deploy, run migrations against RDS and set frontend env vars from stack outputs.
