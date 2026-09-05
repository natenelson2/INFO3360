# Hockey Ops — Product Requirements Brief

This file is the source of truth for the first TanStack Start slice. Implement only what is written here. Do not add authentication, live sports APIs, or extra routes.

## Product summary

This sprint delivers a read-only hockey operations player directory staff can open on arena wifi and use immediately. The app has four pages: Home, Players, Player detail, and Games. Pages are filled from static mock data in the repo and rendered on the server, so the first HTML already contains real names, numbers, and game info—not a spinner. Player pages are shareable, bookmarkable URLs. There is no login and no live league feed.

## Client story

Hockey operations needs a player directory staff can open on arena wifi and use immediately—real content on first paint, not a spinner—and every player page must be linkable and bookmarkable. In this sprint tutorial you will stand up a TanStack Start app, design static and dynamic routes for players and games, validate route and search params in a type-safe way, and render the first pages on the server so the HTML arrives already filled with directory content. You are not expected to type a full framework app by hand. Your job is to think like a director: break the client story into routes and page responsibilities, prompt a coding-agent with clear constraints, then assess whether the result is bookmarkable, type-safe, and server-rendered. Along the way you will learn just enough about project folders, the terminal, and React full-stack routing to review agent output with confidence. By the end you will have a running TanStack Start player directory skeleton—home, players list, player detail, and games routes—with validated params and server-rendered shells tied back to hockey ops acceptance criteria, plus a short handoff note for stakeholders and the next sprint topic.

## Actors and goals

| Actor | What they come to the app to do |
|-------|----------------------------------|
| Arena / hockey ops staff | Open the directory on arena wifi, see real roster and game info on first paint, scan the player list, filter by name or position, open one player, and check the games board. |
| Staff sharing a link | Copy a player URL (or a filtered list URL), send it to a colleague, and expect refresh / new tab to show the same content. |
| Tutorial director (reviewer) | Confirm only four routes exist, params are validated, first HTML contains directory text, and unknown ids / empty filters show clear copy—not a blank spinner. |

## Data assumptions

All data is static mock records in the repo, loaded on the server. No network calls to NHL or any other live API.

### Club (one shared record, not a fifth route)

| Field | Required value |
|-------|-----------------|
| Club name | Harbor City |
| Product name (hero / header) | Harbor City Hockey Ops |
| Home arena | Harbor Arena |
| Timezone | America/Chicago (display clock times as CT) |

Every player is on the Harbor City roster. Every venue=home game uses arena name Harbor Arena.

### Players (seed at least 8)

| Field | Rule |
|-------|------|
| id | Unique lowercase kebab-case string, for example lee-19. This is $playerId. It is not the jersey number. |
| displayName | Full name, First Last (real-looking hockey names, not placeholder Latin). |
| jerseyNumber | Integer 1–99, unique across the seed. Display with no leading zeros. |
| position | Exactly forward, defense, or goalie. |
| shootsOrCatches | Exactly L or R (shooting side for skaters; catching hand for goalies). |
| status | Exactly active, injured, or scratched. |
| hometown | City and region/country, e.g. Winnipeg, MB. |
| notes | One non-empty ops sentence. |

On screen labels: position → Forward / Defense / Goalie; status → Active / Injured / Scratched; shoots/catches → L / R.

**Seed checklist:**
- At least two forwards, two defense, two goalies; at least one of each status.
- At least two players whose displayName shares a substring (e.g. both contain Lee).
- One player with jersey 19 and id lee-19 (so path vs number is obvious).
- Sort lists by jerseyNumber ascending.
- Unknown-player testing uses the literal path /players/this-id-is-not-in-the-seed. Do not seed a player with that id.

### Games (seed at least 6)

| Field | Rule |
|-------|------|
| id | Unique lowercase kebab-case string. Not shown in the UI. Not used in any URL. |
| opponent | Opponent club name. |
| puckDrop | ISO-8601 datetime with offset for America/Chicago (example: 2026-09-05T19:00:00-05:00). |
| venue | Exactly home or away. |
| arenaName | Building name. Home games must be Harbor Arena. |
| status | Exactly scheduled, final, or postponed. |
| ourScore / opponentScore | Integers required when status is final. Omit for other statuses. |

Display puckDrop everywhere as: Sat, Sep 5, 2026 · 7:00 PM CT (weekday short, month short, day, year, en-dot, 12-hour clock, CT). Format in America/Chicago.

Scoreline on screen:
- Final: Harbor City score first, en dash, opponent score, then space and W, L, or T (tie when scores equal). Example: 4–2 W.
- Scheduled or postponed: exactly — (em dash). Never invent a score.

**Seed checklist:**
- Mix of home and away; at least one scheduled, one final, one postponed.
- At least two scheduled games with puckDrop after 2026-09-03T00:00:00-05:00.
- Zero rows that are both postponed and away, so /games?status=postponed&venue=away is a real empty state.
- Sort games by puckDrop ascending, then id ascending.

## Routes

Exactly four user-facing routes. No others.

| Path | Kind | Responsibility |
|------|------|-----------------|
| / | Static | Landing: product name, purpose, links to Players and Games, featured players and next games from mock data. |
| /players | Static | Full player directory. Optional name search and position filter in the URL. |
| /players/$playerId | Dynamic | One player's bookmarkable page. $playerId is the player's id. |
| /games | Static | Games board. Optional status and venue filters in the URL. |

Treat trailing slashes as the same route. Paths are lowercase; /Players is not required.

### Site chrome (every route)

Every page, including player not-found, shows a header with:
- Product name Harbor City Hockey Ops → /
- Players → /players (no search params)
- Games → /games (no search params)

Document titles: Harbor City Hockey Ops on home; Players · Harbor City Hockey Ops; {displayName} · Harbor City Hockey Ops on detail (or Player not found · Harbor City Hockey Ops); Games · Harbor City Hockey Ops.

## First paint

Server-render every route. The first HTML document for a URL must already contain that URL's real content (including filtered lists and empty/not-found copy). A spinner, skeleton-only shell, or "Loading…" as the main body fails—on first document load and on client-side navigations. Do not put a spinner beside empty content and call it done.

Filtered list URLs must be filtered in the first HTML, not filtered only after client JS.

### / Home

Page heading (hero-level, not only nav): Harbor City Hockey Ops.

Also on first paint:
- One supporting sentence: staff player directory and games board for Harbor City (not a public fan site).
- Header links to Players and Games.
- Featured players: the three seeded players with the lowest jersey numbers. Each displayName is a link to /players/{id}.
- Next games: among games with status of scheduled or postponed and puckDrop ≥ now (America/Chicago), take the two soonest. If fewer than two qualify, fill from remaining games by soonest puckDrop. Show opponent, puck-drop text, home/away, status, scoreline. Games are not links to a detail route. Include a text link See all games → /games.

Do not ship Home with zero names.

### /players Players list

- Heading: Player directory
- One row per matching player: display name (link to /players/{id} with no query string), jersey number, position label, status label.
- Default URL lists all seeded players, jersey ascending.
- Visible name search and position filter, reflecting the current URL. Keep controls visible when the list is empty.
- Empty filter copy (exact): No players match that name and position. plus a link Clear filters → /players.

### /players/$playerId Player detail

When the id exists:
- Heading: that player's displayName
- Jersey, position label, shoots/catches, status label, hometown, notes
- Link Back to player directory → /players (drop any previous list search params)

When the id is missing, empty, or not in the seed (including /players/this-id-is-not-in-the-seed):
- Use the framework not-found path (HTTP 404 is correct).
- Heading: Player not found
- Body (exact): No player in this directory uses that id. Return to the player list.
- Link to /players
- Do not redirect to Home. Do not show another player. Do not show a bare framework crash as the only content.

### /games Games list

- Heading: Games
- One row per matching game: opponent, puck-drop text, home/away, arena name, status label (Scheduled / Final / Postponed), scoreline
- Default URL lists all seeded games, puckDrop ascending
- Visible status and venue filters reflecting the URL; keep them when empty
- Empty filter copy (exact): No games match that status and venue. plus Clear filters → /games

Game rows are not links. There is no /games/$gameId.

## Type-safe path and search params

Invalid input must not crash the app. Unknown query keys are ignored (do not strip them unless you are rewriting a known invalid enum).

When a filter is at its default, omit it from the URL. Do not write q=, position=all, status=all, or venue=all. Filter changes replace the current history entry (no stacked back-button trail per keystroke). Updating q on each change is required; debounce is optional.

If the same key appears twice, use the first value.

Parse known enum tokens case-insensitively, then write the canonical lowercase value in the URL. Invalid enum → treat as default in the UI and strip that key from the URL with replace.

### Path params

| Route | Param | Allowed | Invalid behavior |
|-------|-------|---------|-------------------|
| /players/$playerId | playerId | Non-empty string that exactly matches a seeded id (case-sensitive) | Not-found copy above. Do not coerce jersey numbers. /players/19 is not-found unless some id is literally 19. |

Home, Players list, and Games have no path params.

### Search params — /players

Filtered lists are shareable and must survive refresh.

| Param | Meaning | Canonical values | Default |
|-------|---------|-------------------|---------|
| q | Name search | Any string after trim | No name filter (omit from URL) |
| position | Position filter | forward, defense, goalie | All positions (omit). Treat all as missing. |

q matching: trim; if empty after trim, no name filter. Case-insensitive substring of displayName only (not jersey). Multi-word q is still one substring against the full display name. Combined with position using AND.

Invalid position: anything else → all positions, strip the key.

Controls must update the URL so /players?position=goalie is bookmarkable. View Source on that URL must already show only goalies (or empty copy).

### Search params — /games

| Param | Meaning | Canonical values | Default |
|-------|---------|-------------------|---------|
| status | Status filter | scheduled, final, postponed | All (omit). Treat all as missing. |
| venue | Home/away filter | home, away | All (omit). Treat all as missing. |

Invalid status / venue → default that filter and strip the key. Combined with AND.

### / and /players/$playerId

No search params required. Extra keys are ignored; still render.

## Out of scope

- Login, sessions, roles, secrets, or any authentication
- Live NHL / Stats API / CMS / database servers
- Extra routes: /games/$gameId, /login, /settings, /about, CRUD, print-only URLs
- Create / edit / delete players or games
- Maps, tickets, video, live score polling, notifications
- Pagination or infinite scroll (seed stays small)
- i18n or a mandated design-system package
- Prescribing file names, CSS, or UI libraries
- A second empty-data fixture file (empty copy still lives in the UI; shipped seed is non-empty except the postponed+away gap)

## Acceptance criteria

Yes/no checks. All must be yes.

### Server-rendered first paint

1. Opening / shows Harbor City Hockey Ops and at least three real player names and two game lines without a spinner as the main content.
2. View Source (first HTML, not only after client JS) for /players contains at least one seeded displayName as text.
3. View Source for /games contains at least one seeded opponent as text.
4. View Source for a valid /players/{id} contains that player's displayName.
5. View Source for /players?position=goalie contains only goalie rows (or empty copy)—not the full unfiltered roster waiting on client JS.
6. Client navigation from Home → Players still shows real roster text immediately (no spinner-only body).

### Bookmarkable and type-safe

1. Copying /players/{a real id}, opening in a new tab, and refreshing still shows that player.
2. /players/this-id-is-not-in-the-seed shows Player not found and the exact body line, with a link to /players—not another player, not a spinner.
3. /players/19 is not-found (jersey is not the id) while /players/lee-19 shows that player.
4. /players with no params lists all seeded players, jersey ascending.
5. /players?position=goalie lists only goalies; refresh keeps the filter.
6. /players?position=Goalie canonicalizes to position=goalie (or equivalent lowercase) and still filters goalies.
7. /players?position=wing strips the bad param, shows all players, and does not crash.
8. A name search that matches nobody shows exactly No players match that name and position. with filters still visible.
9. /games?status=final&venue=home filters as specified; View Source already reflects the filter.
10. /games?status=postponed&venue=away shows exactly No games match that status and venue.
11. /games?status=done strips status, shows all games, does not crash.

### Navigation and scope

1. Nav works among only /, /players, /players/$playerId, and /games (list → detail → back to /players with no leftover search params).
2. Featured home player names link to the correct detail URLs; game rows do not invent /games/{id}.
3. There is no login wall and no call to a live external hockey API for these pages.

## Handoff note

Stakeholders get at the end of this sprint
- A running TanStack Start skeleton: Home, Players, Player detail, Games
- Roster and games filled from in-repo mock data, visible in the first HTML (usable on arena wifi without waiting on client-only fetch)
- Shareable player URLs and shareable filtered list URLs; unknown ids and empty filters have clear copy
- Validated path/search params as specified above

### Next sprint topic

- Wire richer directory filters (e.g. player status, game date window) and swap static mocks for a real read-only data source—still no auth unless ops explicitly adds it later

node -v