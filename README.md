# IT Ops Vault — Step 2 Scaffold

This is the foundation: project structure, database schema, auth pages,
and a placeholder dashboard shell. No feature modules (Vault, Bookmarks,
Docs) are built yet — that's the next steps. Right now the goal is just
to get this **live and clickable** so you can see it's real.

You will not need to type any code or run any terminal commands. Everything
below happens by clicking through website dashboards.

## What you need to create (all free tiers)

1. **GitHub account** — github.com — to hold the code
2. **Neon account** — neon.tech — the database
3. **Clerk account** — clerk.com — login & organizations
4. **Vercel account** — vercel.com — hosting (sign up with your GitHub account, it's one click)

## Step-by-step

### 1. Put this code on GitHub
- Go to github.com → New repository → name it `itops-vault` → Create
- On the new repo page, click "uploading an existing file"
- Drag in every file/folder from this project (keep the folder structure exactly as-is)
- Commit

### 2. Create the database (Neon)
- neon.tech → New Project → name it anything → Create
- Copy the "Connection string" shown — you'll need it in step 4

### 3. Create auth (Clerk)
- clerk.com → Create application → name it "IT Ops Vault"
- Enable "Organizations" in the sidebar (Configure → Organizations → toggle on) — this is what gives us multi-tenant orgs + roles for free
- Go to API Keys — copy the "Publishable key" and "Secret key"

### 4. Deploy (Vercel)
- vercel.com → Add New → Project → Import the `itops-vault` GitHub repo
- Before clicking Deploy, open "Environment Variables" and add:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → from Clerk
  - `CLERK_SECRET_KEY` → from Clerk
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` → `/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` → `/sign-up`
  - `DATABASE_URL` → from Neon
  - `VAULT_ENCRYPTION_KEY` → any random 64-character hex string. Generate one instantly at https://www.uuidgenerator.net/ (grab two UUIDs, strip the dashes, concatenate, trim to 64 characters) — or ask me and I'll generate one for you in our next message.
- Click Deploy

Vercel installs everything, runs the database migration, and builds the app automatically — this is the part that replaces `npm install` and `npm run dev` for you.

### 5. Push the database schema live
Vercel builds the app but doesn't create your database tables automatically on
first deploy. After the first deploy succeeds, tell me and I'll give you the
one-line command to run **inside Vercel's own web terminal** (Project →
Settings → there's a way to run this without your own machine — I'll walk
you through the exact click path when we get there) to create the tables
from `prisma/schema.prisma`.

## What's actually built right now
- Sign up / log in (Clerk)
- Organization creation + switching (Clerk)
- Sidebar navigation shell: Overview, Vault, Bookmarks, Docs & SOPs, Search, Organization
- Full database schema for every module (vault items, bookmarks, docs + versions, links, audit logs, shares)
- Server-side AES-256-GCM encryption helper, ready for the Vault module
- Audit logging helper, ready to be called from every future write

## What's next (Step 3)
Building the RBAC logic (who can do what per role) and the real password
vault: add/edit/delete secrets, folders, tags, copy-to-clipboard with
auto-clear, and password generator — all wired to encryption + audit
logging that's already scaffolded here.
