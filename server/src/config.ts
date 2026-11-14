import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 5000),
  auth0: {
    audience: process.env.AUTH0_AUDIENCE ?? '',
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL ?? '',
    // Auth0 custom claim that carries the user's role. Add it with an Auth0 Action.
    rolesClaim: process.env.AUTH0_ROLES_CLAIM ?? 'https://vitaltrack.app/roles',
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'vitaltrack',
    // Runs the API (least privilege). The audit table is protected by triggers.
    user: process.env.DB_USER ?? 'vitaltrack_app',
    password: process.env.DB_PASSWORD ?? '',
  },
};

// Fail fast with a clear message instead of a cryptic library assertion.
export function assertConfig() {
  const missing = [
    !config.auth0.audience && 'AUTH0_AUDIENCE',
    !config.auth0.issuerBaseURL && 'AUTH0_ISSUER_BASE_URL',
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing required settings in .env: ${missing.join(', ')}`);
  }
}
