# Auth0 setup for VitalTrack

You need one Auth0 tenant with three things: an API, a Single Page Application, and an Action that adds roles to tokens.

## 1. Create the API

1. Dashboard → **Applications → APIs → Create API**.
2. Name: `VitalTrack API`.
3. Identifier: `https://api.vitaltrack.yourdomain` (any unique URI; it is not a live URL).
4. Signing Algorithm: **RS256**.
5. Copy the Identifier into `.env`:
   - `AUTH0_AUDIENCE`
   - `VITE_AUTH0_AUDIENCE`
6. Set `AUTH0_ISSUER_BASE_URL` to `https://YOUR_TENANT.auth0.com/` (keep the trailing slash).

## 2. Create the Single Page Application

1. Dashboard → **Applications → Applications → Create Application** → *Single Page Web Applications*.
2. Open **Settings** and set these for local development:
   - Allowed Callback URLs: `http://localhost:5173`
   - Allowed Logout URLs: `http://localhost:5173`
   - Allowed Web Origins: `http://localhost:5173`
3. Copy values into `.env`:
   - `VITE_AUTH0_DOMAIN` = your tenant domain, for example `dev-abc123.us.auth0.com` (no `https://`)
   - `VITE_AUTH0_CLIENT_ID` = the Client ID

## 3. Add roles to tokens with an Action

The server and the UI read roles from a custom claim. The name must match `AUTH0_ROLES_CLAIM`, which defaults to `https://vitaltrack.app/roles`.

1. Dashboard → **Actions → Library → Build Custom** → name `Add VitalTrack roles`, trigger *Login / Post Login*.
2. Paste:

   ```js
   exports.onExecutePostLogin = async (event, api) => {
     const claim = 'https://vitaltrack.app/roles';
     const roles = event.authorization?.roles ?? [];
     api.accessToken.setCustomClaim(claim, roles); // used by the API
     api.idToken.setCustomClaim(claim, roles);     // used by the UI
   };
   ```

3. Deploy the Action.
4. Dashboard → **Actions → Flows → Login** → drag the action between *Start* and *Complete* → **Apply**.

## 4. Create roles and assign them

1. Dashboard → **User Management → Roles → Create Role**:
   - `data_entry`: search, view, create and edit patients
   - `medical_admin`: everything above, plus delete patients and view the audit trail
2. Create a test user under **User Management → Users**.
3. Open the user → **Roles** → assign `data_entry` or `medical_admin`.

Users get roles from the Action on their next login, so log out and back in after changing them.

## 5. Check it

1. Run `npm run dev:server` and `npm run dev:client`.
2. Log in with a test user.
3. Patients should load for either role. The **Audit trail** tab should only appear for `medical_admin`.
4. Without a token, `curl http://localhost:5000/api/patients` should return `401`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `401` on every API call | `AUTH0_AUDIENCE` doesn't match the API Identifier, or `AUTH0_ISSUER_BASE_URL` is wrong |
| `403 Forbidden: insufficient role` | Action not deployed or not in the Login flow, or user has no role. Log out and back in |
| Login page loops or shows "Callback URL mismatch" | The URL in Allowed Callback URLs doesn't match the origin you're using |
| Silent token refresh fails | Add the origin to Allowed Web Origins |
| Audit tab missing for an admin | Role claim not in the ID token. Check the Action sets `idToken` too |
