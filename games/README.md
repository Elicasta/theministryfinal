# Bible Battle — broadcast edition

A playable Bible quiz for a host, projector, and phone remotes. The starter game has 30 scripture-linked questions across Pentateuch, Kings, Prophets, Gospels, Acts, and Letters. Four teams are ready by default; names and team count are editable before starting.

## Play immediately on this computer / Wi-Fi

With Node 20 or newer, run `npm run dev` from the repo. No package installation, database account, or AI key is needed. Open `http://localhost:4173/games` and choose **Host a game**. The console prints a Wi-Fi address for other devices. The QR code uses that address, so phones on the same Wi-Fi can join. Allow local network access if the operating system requests it. Keep the server running.

Games persist in `.local/games.json` across server restarts. This file contains private session data and is ignored by Git and blocked by the local web server. Local storage is designed for one Node process on a trusted event network; use the existing Supabase backend for public hosting.

## Run a game

1. Host creates the room, names teams, and shares the join code or QR. The first person on each team becomes captain; the host can choose another captain in the lobby.
2. Open **Projector** in a separate browser window. Use Fullscreen for the audience. Enable sound with a click if desired.
3. Start the game. The host or active captain selects a question. The captain gets 30 seconds by default, followed by the team's open answer window.
4. Players type an answer and lock it. Teammates can send suggestions during captain priority. Host judging is the default: the host can accept alternate wording or spoken answers with **Correct / Incorrect**. Turn it off before starting for exact accepted-answer matching.
5. A wrong answer opens a steal. The first server-accepted buzz wins; a correct steal earns 60% of the question's points. The original team cannot steal.
6. Correct answers and timeouts lead to a persistent answer reveal. **Back to board** continues. Pause, resume, and reset timers from the host. Scores can be adjusted in 100-point increments.
7. Start **Final Round** between questions. Captains lock a private wager and answer. The host judges every team once, including teams that did not answer. The winner or tied winners appear on every screen. **End game** can also finish early.

The host's **New game** creates a fresh room without deleting the previous room. A returning host/player on the same browser resumes their saved session. Keep the host browser's local storage to retain host access.

## Public web hosting

Existing Vercel routes and Supabase tables are reused; no schema migration is required for this upgrade. Configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) on the server. For a new project, run `supabase/game-engine.sql` once. All four game tables must retain RLS with no public client policies. Never expose the secret key to clients.

`SUPABASE_ANON_KEY` enables the optional realtime transport. Polling also works independently. `OPENAI_API_KEY` is optional for existing AI pack generation/voice features; the starter game does not use it. AI voice and pack generation require separate live service testing and are not part of the local acceptance tests.

`/games`, `/games/host`, `/games/play`, `/games/display` and their `/game` aliases are supported. Server-only `/lib` URLs are rewritten to a 404 handler; local static serving uses an asset allowlist. The public state omits answer keys until reveal and exposes player suggestions only to their own team.

## Verification

- `npm test`: complete game, authorization, hidden answers, pause/resume, duplicate scoring, stealing, final locking, concurrent joins, late-answer rejection, private suggestions, and spoken-steal attribution.
- `npm run check`: existing Ministry lesson/game regression checks.
- Browser acceptance: host selects a question, phone joins and preserves typed input through updates, locks an answer, host judges, projector reveals, mobile layout at 390px, projector at 1672×941.

The browser polls authoritative state. Expired windows advance on server reads/actions, including when the host tab sleeps. State changes use version-based compare-and-swap; conflicting requests refresh instead of awarding twice. No phantom player/projector counts are displayed.

## Artwork and third-party assets

`games/assets/bible-backdrop.png` was generated with the built-in image generation tool. Prompt: “Widescreen background texture for a Bible trivia game question panel. An open antique Bible on a dark wooden table, low close camera angle, pages flowing diagonally across the lower right, rich ink navy shadows and subtle warm gold rim lighting on page edges. Moody cinematic realistic still life. Upper left and middle mostly dark empty navy negative space for later interface text. No other objects, no legible text, no title, no logos, no interface elements. Landscape 16:9 composition.”

Team crests are inline SVG. QRCode.js 1.0.0 (MIT license, David Shim) is vendored for reliable QR rendering; see `games/assets/qrcode-LICENSE.txt`. Fonts have system fallbacks if Google Fonts is unavailable.

## Permanent projector link

Use **`/game/projector`** (also `/games/projector`) in your projector browser or browser-source URL. It needs no room code and automatically follows the newest host room on that deployment:

- New room / lobby: branded standby screen.
- Host presses Start Game: the game appears automatically.
- Game ends: returns to standby. Final-round winners remain visible for 20 seconds first.
- Next room starts: switches automatically; the URL never changes.

Use **Copy permanent projector link** in the host's Devices & Systems panel. The host's header Projector link remains a room-specific display if you need to pin a particular game (including its AI voice token). Preview branches and production use separate projector channels, so a preview test cannot take over a production projector. The permanent route uses public audience state and does not grant host control or AI voice credentials. Use the host and projector from the same deployment. Multiple simultaneous rooms are supported by room-specific display links; the permanent route always follows the newest room.

Browser autoplay rules still apply to sound: visuals activate without a click; sound effects require an initial click on Enable sound. The permanent link does not enable AI voice automatically.
