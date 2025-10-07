# Temporary Task Manager

Web-only productivity system enforcing tight priority caps, automated rollovers, and reflective analytics. Built with Next.js 15 (App Router), Supabase, and a modern component stack.

## Tech Stack
- **Framework**: Next.js 15 · TypeScript · App Router
- **Styling**: Tailwind CSS v4 · shadcn/ui
- **State & Data**: Zustand · TanStack Query · Supabase Postgres
- **Utilities**: Day.js · lucide-react · react-hot-toast

## Project Structure
```
app/
  page.tsx            # Open tasks board
  today/              # Daily focus view
  completed/          # Completion log
  someday/            # Someday/Maybe list
  graveyard/          # Chronic rollover archive
  api/                # Next.js edge/server handlers (stubs)
components/
  tasks/              # Task board UI components
  modals/             # Priority & reality check dialogs
  dashboard/          # Priority usage widgets
lib/
  supabase/           # Supabase client factory
  utils/              # Priority, date, rollover helpers
  store/              # Zustand task store
```

## Getting Started
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` for the desktop experience. Mobile safari / Chrome can be used for the capture flow once implemented.

## Available Scripts
- `npm run dev` – start local dev server
- `npm run lint` – run ESLint (Next + Tailwind config)
- `npm run build` – type-check and produce production build
- `npm run start` – run production server after building

## Environment Variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
CRON_SECRET="<shared-secret-for-vercel-cron>"
```

## Next Implementation Milestones
1. Connect Supabase schema + migrations (tasks, history, stats tables)
2. Wire Supabase RPCs into `/api` routes (priority limits, rollovers, analytics)
3. Add React Query hooks + optimistic updates for quick actions
4. Implement reality-check modal flows + override logging
5. Deliver analytics dashboard + Graveyard insights
6. Ship PWA enhancements (manifest, offline cache, background sync)

## Notes
- The repo currently ships placeholder API handlers (`501` responses) and mocked UI actions. These are ready to be replaced with live integrations.
- A pnpm lockfile exists higher in the filesystem hierarchy. Configure `outputFileTracingRoot` in `next.config.ts` or remove unused lockfiles to silence the Next.js warning during builds.
- Tailwind v4 via `@import "tailwindcss";` requires Node 18.17+. Ensure CI/CD matches local versions.
