# GMGold
A personalized system that tracks all elements of a TTRPG. Built as a means to consolidate many different tools into one place.

# Party Sheets — setup walkthrough (square one)

A character-sheet app for your D&D table: players view their sheet and track
HP and resources (spell slots, ki, Wild Shape…), you get a DM view of the
whole party. Think "personalized D&D Beyond," scoped to one thing done well.

**MVP (what's built):** character sheets + HP damage/heal + resource
tracking + inventory + long rest, with DM/player logins.
**Inventory (built 2026-10-27):** a Diablo-style equipment paper doll and a
BG3-style backpack grid with category filters, search, sort, a detail pane,
and a weight bar against STR x 15 carrying capacity (see section 4).
**Explicitly not MVP:** combat tracker, dice roller, spell database, maps.
Those are phase 2 — the trap is building everything at once and finishing
nothing.

**Stack:** Spring Boot (Java 17) + JPA/Hibernate + H2 · React (Vite).
Your interview stack, not something new.

---

## 0. Prerequisites (install once)

1. **Java 17+** — [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17)
   (download the installer for your OS, take all defaults). Verify:
   `java -version`
2. **Node 18+** — [nodejs.org](https://nodejs.org/) (LTS installer). Verify:
   `node -v`
3. **An IDE** — IntelliJ IDEA Community (best Spring support) or VS Code
   with the Java + Spring extensions.
4. **Git** (optional but recommended) — init a repo in this folder on day one.

> The Maven wrapper (`mvnw` / `mvnw.cmd`) is already in `backend/`, so you
> don't need to install Maven separately — the wrapper downloads it on
> first run.

---

## 1. Backend — Spring Boot API

### 1a. How this project was created (so you can reproduce it)

On [start.spring.io](https://start.spring.io), the settings were:

| Setting      | Value                                                        |
|--------------|--------------------------------------------------------------|
| Project      | Maven                                                        |
| Language     | Java                                                         |
| Spring Boot  | 4.x (whatever's default — 3.x concepts are identical)        |
| Group        | com.kish                                                     |
| Artifact     | partysheets                                                  |
| Packaging    | Jar, Java 17                                                 |
| Dependencies | Spring Web, Spring Data JPA, H2 Database, Spring Security, Validation |

Click Generate, unzip, open the folder in your IDE. That's the entire
"project setup" step — no manual config needed to start.

### 1b. Tour of the code

```
src/main/java/com/kish/partysheets/
├── PartysheetsApplication.java   # entry point, nothing to change
├── model/                        # JPA entities = your database tables
│   ├── PlayerCharacter.java      # the character sheet (named PlayerCharacter
│   │                             #   because java.lang.Character already exists)
│   ├── AbilityScores.java        # @Embeddable: six scores live as columns
│   │                             #   on the character's own row, no extra table
│   ├── TrackedResource.java      # spell slots, ki, Wild Shape… (generic by design)
│   └── InventoryItem.java        # inventory lines
├── repository/                   # Spring Data interfaces — no implementation needed
│   ├── CharacterRepository.java  # JpaRepository gives you save/findAll/delete free
│   ├── ResourceRepository.java
│   └── ItemRepository.java
├── service/
│   ├── CharacterService.java     # ALL business rules + @Transactional boundaries
│   └── CharacterNotFoundException.java
├── web/
│   ├── CharacterController.java  # REST endpoints, thin by design
│   ├── ResourceController.java
│   ├── Requests.java             # request-body DTOs as records (+ validation)
│   └── RestExceptionHandler.java # exceptions -> HTTP statuses, one place
└── config/
    ├── SecurityConfig.java       # HTTP Basic, in-memory users, DM vs PLAYER roles
    └── SeedData.java             # seeds your actual party on first boot
src/main/resources/
└── application.properties        # H2 config + H2 console switch
src/test/java/com/kish/partysheets/
└── CharacterServiceTest.java      # service tests against real H2
```

**The three layers and why they're separate** (interviewers ask this):

- **Controller** — speaks HTTP: parse request, call service, return result.
  Zero business logic, which is what makes the next layer testable.
- **Service** — business rules and transactions. `@Transactional` on
  `applyDamage` means the read-modify-write is one DB transaction, and the
  `@Version` field on the character turns concurrent HP edits into a clean
  409 ("refresh and retry") instead of silently losing someone's update.
- **Repository** — Spring Data JPA interfaces. You write the interface;
  Spring generates the implementation, including query methods like
  `findByOwnerUsername` derived from the method name.

### 1c. Run it

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

First run downloads dependencies (a minute or two), then you'll see the
Spring banner and `Tomcat started on port 8080`. Leave it running.

### 1d. Try the API

Logins (dev only): `dm` / `dm` (DM role), or `uri` / `password`,
`etsuko` / `password`, `jelly` / `password`, `odessa` / `password`.

```bash
# list characters (your seeded party)
curl -u dm:dm http://localhost:8080/api/characters

# Uri takes 8 damage (use a real id from the list above)
curl -u dm:dm -X POST http://localhost:8080/api/characters/1/damage \
  -H "Content-Type: application/json" -d '{"amount": 8}'

# heal, long rest, spend a resource
curl -u dm:dm -X POST http://localhost:8080/api/characters/1/heal \
  -H "Content-Type: application/json" -d '{"amount": 5}'
curl -u dm:dm -X POST http://localhost:8080/api/characters/1/long-rest
curl -u dm:dm -X POST http://localhost:8080/api/resources/1/use

# a player trying to create a character gets 403 (DM-only)
curl -u uri:password -X POST http://localhost:8080/api/characters \
  -H "Content-Type: application/json" -d '{"name":"Test"}' -i
```

> PowerShell note: `curl` there is an alias for `Invoke-WebRequest` and the
> quoting differs. Easiest: use Git Bash, Windows Terminal with real curl,
> or just use the React UI below.

**H2 console** (peek at the actual tables): http://localhost:8080/h2-console
— JDBC URL `jdbc:h2:mem:partysheets`, user `sa`, blank password.

### 1e. Run the tests

```bash
./mvnw test     # Windows: mvnw.cmd test
```

`CharacterServiceTest` runs against real H2 (no mocks): HP math, the
never-below-zero / never-above-max clamps, long rest refills, and the
not-found path. `@Transactional` on each test rolls back, so tests never
pollute each other.

---

## 2. Frontend — React sheet UI

### 2a. How it was created

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

(Vite is the standard React scaffolding; `npm run dev` starts it.)

### 2b. Tour of the code

```
src/
├── main.jsx            # entry point (Vite default, untouched)
├── api.js              # every backend call lives here; Basic-auth header attached
├── App.jsx             # login form -> character tabs -> selected sheet
├── CharacterSheet.jsx  # the sheet: HP bar, damage/heal, resources, inventory
└── index.css           # dark-table styling (cosmetic, not the point)
```

`vite.config.js` proxies `/api/*` to `http://localhost:8080`, so the React
app uses relative fetch paths and there's no CORS to configure.

**The key pattern:** every mutation (`api.damage(...)`, …) returns the
updated character, and `App.jsx` swaps it into state by id. No refetch
needed, no stale UI.

### 2c. Run it

```bash
cd frontend
npm run dev
```

Open http://localhost:5173, log in as `dm` / `dm`, click through the four
sheets. Damage Uri, spend a Wild Shape on Jelly, long-rest the party.

---

## 3. How it fits together (the request flow)

```
React (5173) --fetch /api/characters/1/damage--> Vite proxy
  --> Spring Security (is dm:dm valid? is this endpoint allowed?)
  --> CharacterController.damage() (parse JSON -> call service)
  --> CharacterService.applyDamage() (@Transactional: read, clamp, write)
  --> CharacterRepository (Hibernate -> H2)
  <-- updated character JSON flows back up, React swaps it into state
```

If something breaks, this chain tells you where to look: network tab ->
controller -> service -> repository -> DB.

---

## 4. Inventory: equipment doll + backpack (built 2026-10-27)

The MVP focus after the scaffold: inventory players actually touch every
session, split across two tabs on the character sheet.

**Model** (`model/`): `InventoryItem` gained `category` (enum: WEAPON,
ARMOR, CONSUMABLE, GEAR, TOOL, TREASURE, MISC), `weight` per unit in lb,
`rarity` (COMMON to LEGENDARY, presentational only), and `equippedSlot`
(enum, nullable). There is no separate `equipped` boolean: non-null slot
is exactly what equipped means, so the two can never drift apart.
`PlayerCharacter` exposes two derived, unstored properties:
`carryingCapacity` (STR x 15) and `totalWeight` (sum of weight x quantity).

**Rules** (`CharacterService`): only WEAPON, ARMOR and TREASURE are
equippable, each to a fixed slot set (ARMOR includes OFF_HAND so shields
have a home; TREASURE covers neck + rings). Equipping into an occupied
slot swaps the old item back to the backpack instead of deleting it.
Using a consumable decrements quantity and removes the stack at zero.
Every item mutation returns the updated character, matching the app's
existing UI convention. Slot compatibility is enforced server-side; the
frontend's equip dropdown mirrors the same map for display only.

**Endpoints** (`ItemController`): POST `/api/items/{id}/equip` (body:
`{slot}`), POST `/api/items/{id}/unequip`, POST `/api/items/{id}/use`,
DELETE `/api/items/{id}` (drop), POST `/api/characters/{id}/items` (add,
returns the updated character). The old item-delete in
`ResourceController` moved here with the same path.

**UI** (`EquipmentPanel.jsx`, `InventoryPanel.jsx`): the Equipment tab is
a paper doll, slots arranged around a portrait, click an equipped item to
unequip it. The Inventory tab is the backpack grid (equipped items are
excluded, they live on the doll) with category filter tabs and counts,
search, sort by name/weight/quantity, a click-to-open detail pane with
equip (slot picker), use, and drop actions, and a weight bar that turns
red past capacity.

**Tests** (`InventoryServiceTest.java`): equip, equip-swap, incompatible
slot rejection, unequip, consumable decrement + removal at zero,
non-consumable use rejection, add defaults, capacity and weight math.

**Deferred, deliberately:** two-handed weapons blocking the off-hand slot
(the slot map has no notion of it yet); stack splitting; item value/gold.

---

## 5. Your next build tasks (in order — each is 1–2 sessions)

1. **Real stats.** `SeedData.java` has placeholder ability scores/HP —
   replace with your party's actual numbers (or fix them in the UI once
   task 3 exists).
2. **Character creation form** (React, DM only) — POSTs to the existing
   `/api/characters` endpoint. The backend's ready; it's UI-only work.
3. **Edit max HP / ability scores in the UI** — needs a `PUT
   /api/characters/{id}` endpoint (write it — 10 lines mirroring the
   existing ones).
4. **Controller tests** — `@WebMvcTest(CharacterController.class)` with
   `@MockitoBean CharacterService`: assert 404s, 403s, validation 400s
   without booting the whole app. (Your Baeldung Mockito refresher
   applies directly here.)
5. **DM dashboard** — one screen with all four characters' HP bars and
   conditions at a glance. This is what you'll actually use at the table.
6. **Real auth** — replace HTTP Basic + in-memory users with a login form,
   sessions, and a users table. (Biggest single interview topic on this
   list — Spring Security form login.)
7. **Postgres** — run it in Docker, swap the H2 URL in
   `application.properties`, change `ddl-auto` to `validate` + write a
   real migration. Data finally survives restarts.
8. **Deploy** — backend on fly.io or Render (free tier), frontend on
   Vercel/Netlify. A live URL you can put on your resume.
9. **Phase 2** — initiative tracker, dice roller. Only after 1–8.

---

## 6. Interview cheat sheet (what each piece demonstrates)

| Piece | What you can now talk about |
|---|---|
| Entities + `@OneToMany`/`@Embedded` | relational modeling, embeddables vs entities, why `PlayerCharacter` not `Character` |
| Repositories | Spring Data query derivation, what the framework generates for you |
| `@Transactional` + `@Version` | transaction boundaries, optimistic locking, lost-update problem |
| Controllers + DTO records | thin controllers, why records for requests, Bean Validation |
| `RestExceptionHandler` | clean API error contracts, no stack traces to clients |
| SecurityConfig | HTTP Basic vs sessions, role-based access, password hashing (BCrypt) |
| SeedData | `CommandLineRunner`, idempotent seeding |
| Tests | testing against real DB, rollback, behavior specs |
| React + proxy | same-origin API calls, state update by id |

Likely questions this project arms you for: "Tell me about a project you
built." "How do you handle concurrent updates?" "Where do you put business
logic and why?" "How did you model X?" "Walk me through a request."

---

*Built 2026-10-18 as the applied half of the interview-prep plan. Weeks 1–2
stay on Java/Spring fundamentals + LeetCode; this project is where the
patterns get used for real.*
