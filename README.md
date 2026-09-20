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

Users can sign in here with their `talent.sparkxglobal.net` credentials.

`sparkxglobal` and `sparkxtalent` are **two separate Supabase projects** (same
organisation, different regions). They do not share `auth.users`, so a Talent
account does not exist in this project until someone signs in with it. The
`talent-login` edge function bridges the two:

1. It verifies the submitted email/password against the Talent project's auth API.
2. On success it creates — or finds, matching on email — the corresponding user here.
3. It returns a one-time token the browser exchanges for a normal session.

The password is only ever forwarded to the Talent auth endpoint. It is never
stored, logged, or persisted in this project.

Accounts are matched **by email**. If someone already signed up here directly,
signing in with Talent links to that same account instead of creating a duplicate.

### Required setup

Apply the migration, then set two secrets on the **sparkxglobal** project and
deploy the function:

```sh
supabase db push

# From the sparkxtalent project's API settings:
supabase secrets set TALENT_SUPABASE_URL="https://<talent-project-ref>.supabase.co"
supabase secrets set TALENT_SUPABASE_ANON_KEY="<talent anon/publishable key>"

supabase functions deploy talent-login
```

Use the Talent project's **anon** key here, not its service-role key — the
function only needs to verify credentials, not administer that project.
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Until both secrets are set, the Talent option returns a clear
"not configured yet" message rather than failing silently.

After applying the migration, regenerate the database types so
`profiles.talent_user_id` is available to the frontend:

```sh
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Notes

- The bridge is rate-limited to 10 failed attempts per email per 15 minutes, so
  it cannot be used to brute-force Talent accounts.
- `profiles.talent_user_id` records which Talent identity an account is linked to.
- A more secure variant (a redirect flow where Talent issues a signed token, so
  this app never handles Talent passwords) is possible, but requires adding an
  authorize endpoint to the `sparkxtalent` app.

## How can I deploy this project?

You can deploy this project to various platforms:

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Similar GitHub integration for continuous deployment
- **Self-hosted**: Build with `npm run build` and deploy the `dist/` folder to any static hosting service
