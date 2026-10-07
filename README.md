# Kino XII

Cinema booking app for Redberry Bootcamp XII: browse what's showing across four venues, filter sessions, pick seats on a live hall map, and pay — built against the [Kino XII API](https://api.kinoxii.redberryinternship.ge/docs).

Full brief (translated): [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md)

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in frontend/dist
```

`VITE_API_URL` defaults to `https://api.kinoxii.redberryinternship.ge/api` (see `.env.example`).

## Stack

React 19 + TypeScript + Vite · Tailwind CSS v4 · React Router · TanStack Query · React Hook Form + Zod · Axios

## How it's put together

```
frontend/src
├── api/          typed client, endpoints, response types
├── state/        auth, modal controller, toasts, protected-action hook
├── features/     auth modals, booking flow, sessions, movies, profile
├── components/   UI primitives (Button, Modal, Field, States, Badges, Pagination) + layout
├── pages/        Home, Sessions, Movie, Profile, 404
└── lib/          formatting, validation schemas, recently-viewed
```

## Decisions worth knowing

- **Nothing the API owns is hardcoded.** Venues, formats, languages, time bands, sorts, ticket types and their price ratios, age ratings, the seat cap and the hold length all come from `GET /filter-options`, fetched once and cached.
- **The hall map is drawn from `GET /sessions/{id}/seats`** — sections → rows → seats, with aisles from `aisleAfter`. Every hall shape renders without special cases.
- **Login never costs a second click.** Protected actions (Select Seats, My Tickets, Notify Me, Profile) go through `useProtectedAction`: a guest gets the login modal and the action resumes as soon as they sign in. Any `401` from the API does the same — the axios interceptor opens the modal and replays the failed request.
- **The two kinds of 422 are handled differently.** With `errors`, each message is mapped onto its input. Without, it's a booking rule (incomplete profile, age gate, expired hold) and the server's message is shown as written.
- **409 keeps what survived.** When seats are taken between drawing the map and holding them, the lost seat codes are named, marked sold and dropped; the rest of the selection stays, and the map is refetched.
- **The hold countdown runs from `expiresAt`**, not a local 8-minute timer, so background tabs don't drift. Closing the modal releases the hold so the seats go straight back on sale; going back from checkout to the seat map keeps it. A refresh mid-checkout resumes the live hold.
- **Sessions page state lives in the URL** using the API's own parameter names (`venues[]=galleria&date=…&sort=price_asc&page=2`). Copying the link, refreshing and Back all restore the same view; any filter or sort change resets to page 1. Selecting venues narrows the formats to what those venues have and drops selected formats they don't.
- **What's shown after a change comes from the server** — confirmation, refunds and profile saves render the response, not local state.
- **Loading uses skeletons**, every list has an empty state with a way forward, and every failed request offers a retry.

## Notes

- Food/foyer ordering is mentioned in the brief, but the API has no endpoints for it, so it isn't included.
- Built and tested at the 1920×1080 content size from the brief.
