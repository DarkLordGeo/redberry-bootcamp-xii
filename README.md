# Kino XII — Redberry Bootcamp XII Assignment

Deadline: **11 Oct 2026, 23:59** (submit with the email you registered with).
Bonus: a Loom video (max 5 min, link set to Public) explaining your decisions.

## Frontend (`frontend/`)
React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, TanStack Query,
Axios, React Hook Form + Zod.

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL from the assignment docs
npm install
npm run dev
```

- `src/api/client.ts` – Axios instance (base URL from env, Bearer token if present)
- `src/pages/` – one file per Figma screen
- `src/components/` – shared UI
- `src/index.css` – Tailwind `@theme` tokens (fill from Figma)

Full spec in English: [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md)

## TODO
- [ ] Requirements → pages/routes
- [ ] Figma tokens (colors, fonts, spacing)
- [ ] API endpoints + types
- [ ] Deploy + submit
