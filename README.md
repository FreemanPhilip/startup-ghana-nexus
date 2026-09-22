# Startup Ghana Nexus - SparkX Index

## Getting Started

This is a data-driven social platform connecting investors, startups, mentors and key ecosystem players across Africa.

### Development Setup

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Database)

## Signing in with a SparkX Talent account

Users can sign in here with their `talent.sparkxglobal.net` account.

`sparkxglobal` and `sparkxtalent` are **two separate Supabase projects** (same
organisation, different regions). They do not share `auth.users`, so a Talent
account does not exist in this project until someone signs in with it.

This is a **redirect hand-off**, not a password bridge — SparkX Index never
sees a Talent password:

1. "Continue with SparkX Talent" sends the browser to
   `talent.sparkxglobal.net/sso/authorize` with a `redirect_uri` and a CSRF `state`.
2. Talent signs the user in (its own login page) and asks them to approve.
3. Talent's `sso-issue-token` function checks the `redirect_uri` against an
   allowlist and mints a ~2 minute HS256 assertion naming the user.
4. The browser returns to `/auth/talent/callback` with the assertion in the URL
   **fragment** (kept out of server logs and `Referer`).
5. `talent-sso-callback` verifies signature, `iss`/`aud`/`exp`, and that the
   assertion's `jti` has not already been redeemed, then provisions the local
   user and returns a one-time token the browser exchanges for a session.

Accounts are matched **by email**. If someone already signed up here directly,
signing in with Talent links to that same account instead of creating a duplicate.

### Required setup

This spans **both** projects. The shared secret must be byte-identical on each.

```sh
# Generate once, use the same value in both places:
openssl rand -base64 48
```

On **sparkxglobal** (this repo):

```sh
supabase db push
supabase secrets set SPARKX_SSO_SHARED_SECRET="<the generated secret>"
supabase functions deploy talent-sso-callback --no-verify-jwt
```

On **sparkxtalent**:

```sh
supabase secrets set SPARKX_SSO_SHARED_SECRET="<the same secret>"
supabase secrets set SPARKX_SSO_ALLOWED_REDIRECTS="https://sparkxglobal.net/auth/talent/callback"
supabase functions deploy sso-issue-token
```

`SPARKX_SSO_ALLOWED_REDIRECTS` is an **exact-match** allowlist — put the full
callback URL of every host that may receive an assertion (production, and any
preview/staging host you want to work). A prefix check would let a crafted
`redirect_uri` carry the assertion somewhere you don't control.

This app is served from **`https://sparkxglobal.net`**, so that is the origin the
browser sends. The `*.vercel.app` deployment URL is not what users visit, and
Vercel preview deployments get a fresh hostname each time — neither is in the
allowlist unless you add it explicitly. For local development add
`http://localhost:8080/auth/talent/callback` as a second comma-separated entry.

`talent-sso-callback` is deployed `--no-verify-jwt` because the caller is signed
out by definition; it authenticates the request by verifying the assertion
itself. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

If this app is not served from `https://talent.sparkxglobal.net`'s sibling
default, override the Talent origin at build time:

```sh
VITE_TALENT_ORIGIN="https://talent.sparkxglobal.net"
```

After applying the migration, regenerate the database types so
`profiles.talent_user_id` is available to the frontend:

```sh
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

Until the secrets are set, the flow surfaces a clear "not configured yet"
message rather than failing silently.

### Notes

- Assertions are **single use**: `talent_sso_used_tokens` records each redeemed
  `jti`, so a replayed assertion is rejected inside its own validity window.
- `profiles.talent_user_id` records which Talent identity an account is linked to.
- Rotating `SPARKX_SSO_SHARED_SECRET` requires updating both projects together;
  in-flight assertions (≤2 min) will fail during the swap.

## How can I deploy this project?

You can deploy this project to various platforms:

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Similar GitHub integration for continuous deployment
- **Self-hosted**: Build with `npm run build` and deploy the `dist/` folder to any static hosting service

### Client-side routing (required)

This is a single-page app using React Router. `npm run build` emits **one**
`index.html` and no per-route files, so the host must serve `index.html` for
every path it doesn't recognise as a real file. Without that, the landing page
works but every other URL — `/sparkx-index`, `/auth`, `/dashboard` — returns the
host's own 404 on a direct visit or a refresh, and signing in appears to "go
blank" because the post-login redirect is a fresh page load.

`vercel.json` handles this:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

Two things to keep in mind:

- **Do not add `cleanUrls: true`.** It strips the `.html` extension, which can
  leave the rewrite pointing at a path that no longer resolves, reintroducing
  the 404 on every route.
- Static files under `dist/` are matched *before* rewrites, so the catch-all
  does not swallow `/assets/*`, `/favicon.ico` or `/og-image.png`.

On another host the equivalent is a SPA fallback — for Netlify, a `public/_redirects`
containing `/* /index.html 200`.
