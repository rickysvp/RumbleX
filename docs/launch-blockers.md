# RumbleX — Launch Blocker List

> Generated: 2026-04-23 · Matches v0.1.44 architecture on Monad testnet.

---

## Priority key

| Symbol | Meaning |
|---|---|
| **P0** | Must fix before any go-live attempt. Will cause hard failure at launch. |
| **P1** | Should fix before public alpha. Causes user-visible confusion or support load. |
| **P2** | Can defer to post-launch iteration. Risk is low or mitigated by docs. |

---

## P0 — Must Fix Before Launch

### B1 · Root `.env.example` misleads about what the indexer reads

**File**: `.env.example`  
**Problem**: The file header says "Copy to `.env.local`" and includes `INDEXER_*` variables, implying that setting `INDEXER_POLL_INTERVAL_MS` in root `.env.local` will affect the indexer. It will not — the indexer calls `dotenv.config()` with no path argument, which reads **`services/indexer-api/.env`** (when run from that directory) or **`<repo-root>/.env`** (when run via `npm run indexer:api` from root). Root `.env.local` is only read by Vite (frontend) and `validate-manifest.ts`.  
**Impact**: A developer following the template will set `MONAD_RPC_URL` in root `.env.local`, run `npm run indexer:api`, get `MONAD_RPC_URL is required`, and have no obvious path forward.  
**Fix**: Root `.env.example` now clearly states which vars are used by which layer. `INDEXER_*` vars include a note that they only take effect when placed in `services/indexer-api/.env`, not root `.env.local`.  
**Status**: ✅ Fixed in this pass (see Files Changed below).

---

### B2 · Go-live checklist "Environment Setup" step is incomplete

**File**: `docs/go-live-checklist.md`  
**Problem**: Step "Environment Setup" tells the operator to "Copy `.env.example` → `.env.local` at repo root" and "Fill in `MONAD_RPC_URL`" — but never mentions that the indexer needs its *own* `services/indexer-api/.env`. An operator following only the checklist will have the frontend and validate-manifest working but the indexer failing with `MONAD_RPC_URL is required`.  
**Impact**: Launch attempt fails at Step 5 with a cryptic startup error.  
**Fix**: Added explicit sub-step in Environment Setup: "Copy `services/indexer-api/.env.example` → `services/indexer-api/.env` and set `MONAD_RPC_URL` + `MONAD_CHAIN_ID`".  
**Status**: ✅ Fixed in this pass.

---

## P1 — Should Fix Before Public Alpha

### B3 · `npm run indexer:api` from repo root has no file-based env path

**File**: `services/indexer-api/src/main.ts` + root `package.json`  
**Problem**: `npm run indexer:api` (root) launches tsx from CWD = repo root, so `dotenv.config()` looks for `<repo-root>/.env`. There is no `<repo-root>/.env` in the normal developer setup (gitignored, no template). The only working paths are: (a) `cd services/indexer-api && npm run dev`, or (b) export env vars in shell before running from root. This is fine for CI (env injected directly) but creates a second-class experience for the "run everything from root" developer.  
**Impact**: Developer confusion; root README documents this correctly now, but the UX gap remains.  
**Fix**: Added fallback loading logic to `main.ts` — if `dotenv.config()` does not load a `MONAD_RPC_URL` (because there is no root `.env` or exported variable), it explicitly checks for and loads `services/indexer-api/.env`.  
**Status**: ✅ Fixed in this pass.

---

### B4 · CI smoke job silently skips on all forks and unset secrets

**File**: `.github/workflows/indexer-api.yml`  
**Problem**: The smoke job's `if: ${{ secrets.MONAD_RPC_URL != '' }}` evaluates to `false` on forks and on repos where the secret is unset — the job is skipped with no warning, giving a false green. There is no required-status-check configured to catch this.  
**Impact**: PRs that break the live API path can merge silently if the RPC secret is not set in the repo.  
**Fix**: Add a required-check note in the repo settings documentation, or add a `lint-build-only` required status check and mark the smoke job as `continue-on-error: true` with an explicit skip annotation. **Not fixed in this pass.**

---

### B5 · No `DEPLOYER_PRIVATE_KEY` guidance in `.env.example`

**File**: `.env.example` and `docs/go-live-checklist.md`  
**Problem**: `DEPLOYER_PRIVATE_KEY` is required by the Forge deploy scripts but is not mentioned in root `.env.example`. The checklist says "export only for the session" which is the right advice, but a new operator has no template variable to remind them.  
**Impact**: Operator runs `forge script` without the key, gets a Foundry error, must read `onchain/deployments/README.md` to find the full env list.  
**Fix**: Add a commented-out `# DEPLOYER_PRIVATE_KEY=` entry to root `.env.example` with a note that it must be exported as a shell var, never stored in a file. **Not fixed in this pass — kept out of scope to avoid mixing concerns.**

---

## P2 — Can Defer

### B6 · `services/indexer-api/data/` directory is not auto-created on first run

**File**: `.gitignore` + `JsonStore` implementation  
**Problem**: The indexer writes its database to `services/indexer-api/data/indexer-db.json`. The directory is gitignored. If it doesn't exist on a fresh clone, the indexer crashes with `ENOENT` on the first write.  
**Impact**: First-run failure on clean environments without a clear error message.  
**Fix**: Add `fs.mkdirSync(dir, { recursive: true })` before the first write in `JsonStore`, or add a `postinstall` script. **Not fixed in this pass.**

---

### B7 · `onchain/README.md` is unmodified Foundry boilerplate

**File**: `onchain/README.md`  
**Problem**: The onchain README is the generic Foundry init template with a small RumbleX-specific section appended. It does not name the contracts, explain their roles, or link prominently to `deployments/README.md` which has the actual deploy instructions.  
**Impact**: A contributor looking at `onchain/` has no immediate path to deployment instructions.  
**Fix**: Replace with a RumbleX-specific README naming the contracts and linking to `deployments/README.md`. **Not fixed in this pass — low urgency, deployments/README.md is comprehensive.**

---

## Summary table

| ID | Description | Priority | Status |
|---|---|---|---|
| B1 | Root `.env.example` misleads about indexer env loading | P0 | ✅ Fixed |
| B2 | Go-live checklist missing indexer `.env` setup step | P0 | ✅ Fixed |
| B3 | `npm run indexer:api` from root has no file-based env path | P1 | ✅ Fixed |
| B4 | CI smoke silently skips when secret unset | P1 | ⬜ Open |
| B5 | `DEPLOYER_PRIVATE_KEY` not in `.env.example` | P1 | ⬜ Open |
| B6 | `data/` dir not auto-created on first run | P2 | ⬜ Open |
| B7 | `onchain/README.md` is Foundry boilerplate | P2 | ⬜ Open |
