# Kino XII — Redberry Bootcamp XII Assignment (English notes)

Source: Redberry bootcamp library (Georgian), translated and condensed.
- Figma: https://www.figma.com/design/rBonynbM7wSNOmPs4cryxT/Redberry-Bootcamp-XII
- API docs (Swagger): https://api.kinoxii.redberryinternship.ge/docs
- API base URL: `https://api.kinoxii.redberryinternship.ge/api`
- Seeded test account: `jane@kinoxii.test` / `password` (complete profile, tickets in both tabs)

**What it is:** a cinema booking web app — home page, sessions list with filters,
movie details, 2-step booking modal (seats → checkout), profile + my tickets.

---

## General requirements
- Build at the Figma size: **1920×1080 content width**. Tested at that size.
- Any stack allowed; stack choice is not graded.
- **Commit discipline is graded**: many small logical commits (fewer than ~5–10 hurts the grade), short descriptive messages.
- Must be **hosted online** (Netlify / Vercel / GitHub Pages…).
- Repo must be **public** with full access.
- Deadline: **11 Oct 2026, 23:59:59**.
- Optional Loom video (affects grade): how you built it and solved specific problems.
- Prioritise the listed criteria first; extras only after.

## Modal behaviour (all modals)
- Dimmed/blurred backdrop.
- Close via X, Close button, **Escape**, and overlay click.
- Validation errors appear **on blur**.
- Valid field → green border or checkmark. Invalid → red border + message.
- Loading state while submitting.

## Statuses & error handling (graded on every page)
- **Loading:** every async op has visible loading (page load, filter change, form submit). Sessions use **skeletons**, not full-page spinners.
- **Empty:** every list has an empty state with explanation + way out where sensible (no filter matches, no upcoming tickets, no past tickets, no menu items in category).
- **Error:** failed requests show a message **with retry** — never a blank screen or console-only error.
- `401` session expired → open login modal, then **resume the interrupted action** after login.
- `409` resource taken (seats, pickup slot) → handle per section, keep what survived.
- `422` validation → show per field.
- `500` → generic error with retry.
- **Interaction safety:** request-sending buttons disabled while in flight; rapid clicking must not create duplicate orders/holds; data shown after a mutation must come **from the server**, not optimistic local edits.

---

## 1. Registration & login
### Login modal
Opens from: navbar "Log In"; "Select Seats" on a session when guest; "My Tickets" when guest; "Notify Me" on a Coming Soon film when guest; trying to open profile when guest; foyer order when guest; any protected action; **automatically on any API 401**.

Fields:
- Email — required, valid email
- Password — required, min 3 chars

Footer: "Log In" submit; "Don't have an account? Sign Up" → closes login, opens register; Close/X/outside click closes.

On success: modal closes; user stays on the same page with authed state; navbar updates.
**Important:** if login was triggered by a protected action (e.g. "Select Seats"), that action **continues automatically** — user must not click again.

On error: API message shown inside the modal; modal stays open; email keeps its value.

### Registration modal
Opens from: navbar "Sign Up"; "Sign Up" link in login modal.

| Field | Required | Rules |
|---|---|---|
| Username | yes | unique, min 3 |
| Email | yes | unique, valid email |
| Password | yes | min 3 |
| Confirm Password | yes | must match password |
| Avatar | no | image: jpg, png, WebP |

- Uniqueness checked by the backend; show the API error on the specific field.
- Avatar upload shows a **preview** in the modal; wrong format shows an error.
- Footer: "Sign Up" submit; "Already have an account? Log In" link; Close/X.
- On success: modal closes, same page, authed state.
- **Profile is incomplete after registration.** Trying to buy a ticket must show a message asking to complete the profile and open the profile modal/page.

## 2. Home page (guests + users)
- **Hero:** animated preview of **4 featured** films.
- **Recently viewed:** films recently viewed/opened (shown to guests and users).
- **Now Playing:** big cards, horizontal layout. Card: poster, title, age-rating badge (G / PG / 12+ / 16+ / 18+), duration, starting price ("from ₾XX"), "Buy Ticket" → movie details. "See All" → sessions page.
- **Coming Soon:** poster, title, age rating, duration, release date. No sessions → clicking must **not** go to seat selection.

## 3. Sessions page (public)
Left **sticky** filter sidebar + right session list.

Filters:
- **Venue:** checkbox list (multi), shows name + city.
- **Date:** horizontal picker of the **next 7 days**, single select, highlighted, **default today**.
- **Format:** Standard, MAX, ATMOS, PANORAMA, MOTION (multi). **Dynamic:** when venues are selected, show only formats available at those venues; none selected → all formats.
- **Language:** Georgian dub, Georgian subs, original with subs, Russian dub (multi).
- **Time of day:** morning (<12:00), day (12–18), evening (>18:00) (multi).
- Footer: "Clear All Filters" (clears everything **except date**); active count "X filters active".

List header:
- Sort dropdown: Showtime Earliest First, Showtime Latest First, Price Low→High, Price High→Low, Title A–Z.
- Counter: "Showing X sessions" or "No sessions found".

Sessions grouped by film rows (poster, title, age rating, duration), individual sessions underneath. Each session: start time, venue + hall, format badge, language, price ("from ₾XX"), seats left (or "Sold out"). Click → seat selection. Sold-out = visibly disabled, not clickable.
Pagination: **10 films per page**, prev/next arrows, page numbers, current/total.

**URL state (mandatory):** filters, sort, page as query params, e.g.
`/sessions?venues[]=galleria&venues[]=vake&date=2026-11-14&formats[]=max&sort=price_asc&page=2`
- Copy URL into new tab → same view. Refresh keeps filters. Browser Back restores previous filter states.
- Changing a filter or sort **resets to page 1**.

## 4. Movie details page (public)
Shows: title, backdrop + poster, description, age rating with explanation, duration, genre, director + main cast, release date, available formats.

Sessions section: same 7-day date picker; sessions for the chosen date **grouped by venue**; each shows time, hall, format, language, price, seats left; click → seat selection; empty date → message.

**Age gate:** for 16+/18+ films, if the logged-in user is younger (from profile DOB), sessions are disabled with: "This film is rated 18+. You cannot buy tickets for it with this account." Guests can still click; check happens after login.

## 5. Two-step purchase modal
Requires auth + complete profile. Guest click → login modal first.
Header always shows: session info (title, venue, hall, date, start time, format, language) + step indicator (1. Seats → 2. Checkout).

### Step 1 — Seat selection
- **Hall map from API** (sections → rows → seats). **No hardcoded rows/seats.**
- Seat status: available, sold, held (someone else), unavailable.
- Max **3 seats** per order (notice on 4th attempt) — read cap from API.
- Sold/held/unavailable not selectable. **Legend** for all colours.
- **Ticket types** per seat (default Adult): Adult 100%, Child 60% (**not allowed for 16+/18+**), Student 75%. Rule violation → show the specific seat + reason, block continuing.
- **Price summary** updates live: one row per seat (seat code, seat type, ticket type, price) + subtotal.
- **"Next: Checkout"** enabled only if: authed with complete profile; passes age gate; ≥1 seat; all rules satisfied.
- On click: POST hold. Success → API returns expiry; start **8-min** countdown; go to Step 2.
  **409:** someone took seats; response has lost seat codes → show clear message naming them, mark them sold, remove from selection, **keep the rest**, refetch the map.

### Step 2 — Checkout
- Hold countdown timer.
- Final summary: seats with ticket types, selected food/drinks + pickup slot (if any), grand total.
- Buyer + card form:

| Field | Required | Rules |
|---|---|---|
| Full Name | yes | prefilled from profile, min 3 |
| Email | yes | prefilled, valid |
| Mobile Number | yes | prefilled, Georgian format |
| Card Number | yes | 16 digits |
| Expiry | yes | MM/YY, in the future |
| CVV | yes | 3 digits |

- "Pay & Complete Order": loading state, double-submit protected. Success → close, show confirmation. **422** → per-field errors. **409** (foyer slot full) → back to step with message.
- **Hold expiry:** 8 minutes from end of Step 1. At zero: release seats, clear selection, go back to Step 1, refetch map, show "Your hold time expired. Please re-select your seats."

### Confirmation view
Success message with order reference; ticket + seat details; foyer order + pickup code (if any); "My Tickets" → my tickets page; "Close".

## 6. Profile page (auth only; guest → login modal)
### Personal information form
| Field | Required | Rules |
|---|---|---|
| Full Name | yes | 3–50 chars |
| Email | yes | from registration, read-only |
| Mobile Number | yes | Georgian: `5XX XXX XXX` or `5XXXXXXXX` |
| Date of Birth | yes | must be at least 12 years old |
| Preferred Venue | no | select from venues |

Messages:
- Name: "Name is required" / "Name must be at least 3 characters" / "Name must not exceed 50 characters"
- Mobile: "Mobile number is required" / "Georgian mobile numbers must start with 5" / "Mobile number must be exactly 9 digits" / "Please enter a valid Georgian mobile number (9 digits starting with 5)"
- DOB: "Date of birth is required" / "Please enter a valid date of birth" (future) / "You must be at least 12 years old to create an account"
- Age from DOB controls which films can be booked; show eligibility note, e.g. "you cannot buy tickets for 16+ or 18+ titles".

Save & status:
- "Save Changes" disabled until changed and valid; loading on submit.
- **Incomplete:** can't buy tickets or order from foyer; **yellow dot** on navbar profile link; banner "Please complete your profile to enable booking."
- **Complete:** "Profile Complete ✓"; navbar indicator turns **green**.

### My Tickets — tabs Upcoming / Past
Upcoming card: poster + title; venue, hall, date, start time; format + language; seats with ticket types; total paid; "Refund" button.
Refund: allowed until **2 hours before** start; after that disabled with reason shown. Click → API request, seats freed, ticket leaves Upcoming.
Past: same info, no actions.

---

## API notes (from Swagger; partial — finish reading seats/holds/orders/tickets/foyer at build time)
Conventions: money is lari as a plain number (`24`, `14.5`). Auth: `Authorization: Bearer <token>`.

Booking flow: `GET /sessions/{id}/seats` → `POST /sessions/{id}/holds` → `POST /orders`.

Error shapes:
- `401` token missing/expired → login modal, then **replay the action**. (On `/login` itself, 401 = wrong credentials: keep modal open, keep email, show `message`.)
- `403` record belongs to another account (bug).
- `409` seats taken → read `contested`, mark sold, keep rest, refetch map.
- `422` **with `errors`** → map each key onto its input. `422` **with only `message`** → booking rule (incomplete profile, age gate, expired hold) → show `message` as-is.
- `404`, `500` → retry.

Server-enforced rules (mirror in UI): max 3 seats; no child tickets on 16+/18+; age gate vs DOB; holds 8 min; refunds close 2h before; booking needs complete profile (name, mobile, DOB).

Endpoints:
- `POST /register` (multipart) `{username, email, password, password_confirmation, avatar?}` → 201 `{data}` with token; logs the user in; `profileComplete: false`. Note snake_case `password_confirmation`.
- `POST /login` `{email, password}` → 200 `{data}` with token; 401 `{message}`.
- `POST /logout` [auth] → 204; clear stored token regardless.
- `GET /me` [auth] → `{data: User}`; call on boot if a token exists; 401 → drop token, treat as guest.
- `PUT /profile` [auth] (multipart) `{fullName, mobileNumber, dateOfBirth, preferredVenueId?, avatar?}` → `{data: User}`. Email ignored. Error strings are the exact brief strings — show as returned. Spaces stripped from mobile. Response includes derived `age` (use for eligibility notice: "You are 24, you can buy tickets for all age ratings"). `profileComplete` drives navbar dot + banner.
  - (Multipart PUT may need `POST` + `_method=PUT` — verify.)
- `GET /filter-options` → fetch once at boot, cache. Venues (`venues[].formats`), formats, languages, time bands, sorts, ticket types, age ratings, `maxSeatsPerOrder`, `holdMinutes`. **Hardcode none of it.**
- `GET /search?q=` → ≤6 `Movie`s, for header typeahead; blank q → []. Debounce.
- `GET /movies/now-playing?limit=` → `[MovieWithSynopsis]` alphabetical.
- `GET /movies/coming-soon?limit=` → `[Movie]`, no sessions.
- `GET /movies/featured` → `[MovieWithSynopsis]` hero carousel (bookable).
- `GET /movies/{movie}` → `MovieDetail`; `availableDates` (disable empty days in picker); `ageRating.description` (badge tooltip), `ageRating.minAge` (compare to user `age`).
- `GET /movies/{movie}/sessions?date=` → `[{venue, sessions:[Session]}]`; sessions have `seatsLeft`, `isSoldOut`; `language.code` (ENG/GEO/RUS badge), `language.name`.
- `POST /movies/{movie}/notify` [auth] → 201 (idempotent).
- `GET /sessions` → `{data:[{movie, sessions}], meta}`; 10 **films** per page; `meta.totalSessions` for the counter, `meta.totalMovies`, `meta.lastPage`. Query: `date`, `venues[]`, `formats[]`, `languages[]`, `bands[]` (slugs from filter-options), `search`, `sort` (`time_asc|time_desc|price_asc|price_desc|title_asc`, default `time_asc`), `page`. AND across filters, OR within. Changing filter/sort → page 1; selecting venues narrows formats and drops unsupported selected formats. Sold out = disabled, not hidden.
- `GET /sessions/{session}` → `Session` (booking modal header).
- `GET /sessions/{session}/seats` → hall map exactly as in DB; four halls shaped differently — draw from response.
- `POST /sessions/{session}/holds` [auth] — hold seats (Step 1 → Step 2); returns expiry. 409 → `contested` seats.
- `GET /holds/{hold}` [auth] — read a hold back.
- `DELETE /holds/{hold}` [auth] — release a hold (e.g. user closes modal / goes back).
- `POST /orders` [auth] — pay and complete the order (Step 2).
- `POST /orders/{order}/refund` [auth] — refund (closes 2h before start).
- `GET /tickets` [auth] — My Tickets (Upcoming / Past).
- Schemas: User, Venue, Format, Language, Genre, AgeRating, TicketType, Movie, MovieWithSynopsis, MovieDetail, Session, Seat, SeatMap, SeatHold, Order, ValidationError.
- TODO at build time: read exact request/response bodies for holds, orders, tickets, refund (Swagger).

**Foyer / food ordering:** mentioned in the spec (checkout summary, confirmation, 409 pickup slot), but the API has **no foyer, menu or pickup-slot endpoints**. Out of scope — skip it.
