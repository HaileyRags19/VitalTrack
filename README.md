# VitalTrack

Secure patient-record portal with an append-only audit trail.

- **Client:** React 19 + TypeScript + Vite, Auth0 login (`client/`)
- **API:** Node.js + Express 5 + TypeScript, Auth0 JWT checks, Zod validation (`server/`)
- **Database:** PostgreSQL 15+ with triggers that log every write, and a read-only audit table

## Roles

| Role (Auth0 custom claim) | Can do |
| --- | --- |
| `data_entry` | Search, view, create and edit patients |
| `medical_admin` | Everything above, plus delete patients and view the audit trail |

Full Auth0 walkthrough: [docs/AUTH0_SETUP.md](docs/AUTH0_SETUP.md).

Set the roles claim with an Auth0 Action (`api.accessToken.setCustomClaim`) using the
claim name in `AUTH0_ROLES_CLAIM`. The server enforces roles; the UI only hides controls.

## Setup

```bash
npm install
cp .env.example .env         # fill in Auth0 and database values
npm run db:init              # creates tables, triggers, and grants (uses owner account)
npm run dev:server           # API on :5000
npm run dev:client           # UI on :5173 (proxies /api to :5000)
```

Create the database and roles first, for example:

```sql
CREATE ROLE vitaltrack_app LOGIN PASSWORD '...';
CREATE DATABASE vitaltrack;
```

## Audit trail

- Triggers record INSERT, UPDATE and DELETE on `patients`.
- Viewing a patient writes a VIEW entry.
- Each entry records the Auth0 user id (`performed_by`), taken from the token and set per transaction
  with `set_config('app.user_id', ...)`.
- `audit_logs` is append-only: the app role has no UPDATE or DELETE privilege, and a trigger rejects them for everyone.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Typecheck server and client, build the client |
| `npm run db:init` | Apply schema and grants |
| `npm run start:server` | Start the API without watching |
