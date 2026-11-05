# SMART CHILD (maktab-nazorati) — Safe Codebase Cleanup Audit Report
**Date:** 2026-11-05  
**Branch:** `cleanup/remove-dead-code`  
**Status:** Audit Complete — Awaiting User Approval before any deletion.

---

## Executive Summary

| Category | Total Identified Items | LOW Risk | MEDIUM Risk | HIGH Risk (Keep/Decide) |
|---|---|---|---|---|
| **A. Dead Files** | 13 | 11 | 2 (`server.py`, `AttendanceTab.tsx`) | 0 |
| **B. Dead Code in Live Files** | 7 | 7 | 0 | 0 |
| **C. Obsolete Map Code** | 3 | 3 | 0 | 0 |
| **D. Duplicate Logic** | 2 | 1 (`haversine`) | 0 | 1 (Dual-context configs) |
| **E. Unused Dependencies** | 3 | 3 | 0 | 0 |
| **F. Unused API Routes / DB Schemas** | 8 | 0 | 0 | 8 (Planned architecture) |
| **G. Unused Assets** | 0 | 0 | 0 | 0 |
| **H. Build & Docker Leftovers** | 2 | 0 | 0 | 2 (Dual context: keep) |
| **I. Security Findings** | 3 | 0 | 2 | 1 |
| **TOTALS** | **41** | **25** | **4** | **12** |

---

## Baseline Verification Results

Before performing any cleanup, the baseline environment was verified:
- **Git State:** Clean working tree, checked out to isolated branch `cleanup/remove-dead-code`.
- **Backend Test Suite (Vitest):** `40/40` tests PASS.
- **Frontend Build (Vite + TypeScript):** Successful production build in `1.94s`.
- **Automated Smoke Test (`tools/smoke.js`):**
  - Server starts on allocated port: **PASS**
  - `GET /health` returns 200 with DB status: **PASS**
  - `GET /` serves compiled frontend HTML: **PASS**
  - `POST /api/v1/auth/login` responds to credentials: **PASS**
  - `GET /api/v1/students` returns student array (count: 4): **PASS**
  - `POST /api/v1/telemetry/simulate-walk` responds with live geofence evaluation: **PASS**
- **Database Safety Guard:** With `REQUIRE_PG=true` and no `DATABASE_URL`, server fails immediately with Uzbek diagnostic guidance.

---

## Detailed Findings by Category

### A. Dead Files (Unused files, scratch scripts, obsolete prototypes)

| # | File Path | Lines | Description & Evidence | Risk Level | Proposed Action |
|---|---|---|---|---|---|
| 1 | `test_node.js` | 3 | Scratch Node.js test file (`fs.writeFileSync('node_works.txt')`). Already ignored in `.gitignore`. Zero references. | **LOW** | Delete |
| 2 | `push_to_github.bat` | 21 | Scratch Windows batch script for manual git pushing. Not part of CI/CD or npm. | **LOW** | Delete |
| 3 | `push_to_github.sh` | 21 | Scratch bash script for manual git push. Not part of CI/CD or npm. | **LOW** | Delete |
| 4 | `upload_to_github.py` | 193 | Scratch Python script used in earlier sessions to upload via GitHub API. | **LOW** | Delete |
| 5 | `direct_github_push.py` | 77 | Scratch Python script used to push fixed files via GitHub REST API. | **LOW** | Delete |
| 6 | `scratch/modernize_frontend.py` | 408 | Scratch Python script containing hardcoded Windows paths (`c:\users\steamuser...`) used to modify old static index.html. | **LOW** | Delete |
| 7 | `backend/test_runner.py` | 17 | Scratch Python test script writing to Windows path (`runner_log.txt`). Vitest handles all backend tests. | **LOW** | Delete |
| 8 | `watch-app/test_run.py` | 5 | Scratch Python script creating `test_file_created.txt`. Zero references in Android Gradle or Wear OS code. | **LOW** | Delete |
| 9 | `frontend/src/components/Navbar.tsx` | 168 | Obsolete top navigation bar from pre-redesign. Completely replaced by `Sidebar.tsx` and `Topbar.tsx`. Zero imports across repo. | **LOW** | Delete |
| 10 | `frontend/src/config/mapConfig.ts` | 63 | Obsolete map configuration file. `LeafletOsmAdapter` defines its own constants (`OSM_URL`, `ESRI_SATELLITE_URL`). Zero imports in `frontend/src/`. | **LOW** | Delete |
| 11 | `frontend/src/components/ui/tabs.tsx` | 50 | Radix UI Tabs primitive from initial shadcn setup. All tabs in the app are driven by custom Tailwind sidebar/topbar. Zero imports in application. | **LOW** | Delete |
| 12 | `backend/server.py` | 889 | Complete 889-line Python HTTP server prototype duplicating `backend/server.js`. Production stack runs strictly Node.js (Dockerfiles, render.yaml, railway.json). | **MEDIUM** | Needs User Decision (Delete or archive) |
| 13 | `frontend/src/components/AttendanceTab.tsx` | 177 | Pre-redesign attendance table. Attendance is now unified inside `StudentsTab.tsx` and `ReportsTab.tsx`. Imported on `App.tsx:11` but never rendered in JSX. | **MEDIUM** | Needs User Decision (Delete or keep) |

---

### B. Dead Code Inside Live Files

| # | File Path | Line(s) | Description & Evidence | Risk Level | Proposed Action |
|---|---|---|---|---|---|
| 1 | `backend/server.js` | 23 | `optionalAuthMiddleware` imported from `./auth` but never attached to any route. | **LOW** | Remove unused import |
| 2 | `backend/server.js` | 34 | `LocationBatchSchema` imported from `./services/trackingService` but never referenced. | **LOW** | Remove unused import |
| 3 | `frontend/src/App.tsx` | 11 | `import { AttendanceTab } from '@/components/AttendanceTab';` - imported but never rendered in JSX. | **LOW** | Remove unused import |
| 4 | `frontend/src/components/MapView.tsx` | 89 | `const [searchQuery, setSearchQuery] = useState('');` - declared state never read or set (managed inside `SearchCombobox`). | **LOW** | Remove unused state |
| 5 | `frontend/src/components/MapView.tsx` | 13, 16, 28, 29, 31, 33-36 | Unused imported Lucide icons: `Radio`, `Activity`, `ChevronRight`, `ChevronLeft`, `Thermometer`, `Footprints`, `Clock`, `Sparkles`, `Target`. | **LOW** | Remove unused icon imports |
| 6 | `frontend/src/lib/geoUtils.ts` | 14-17, 36-47, 49-65 | Unused exported helper functions: `calculatePerimeter`, `generateCirclePolygon`, `isPointInPolygon` (point-in-polygon is handled by backend `trackingService.js`). | **LOW** | Remove or mark internal |
| 7 | `frontend/src/lib/utils.ts` | 8-16 | Unused helper function `formatTime`. Defined but never imported or called across frontend. | **LOW** | Remove |

---

### C. Obsolete Map Code

| # | File Path | Line(s) | Description & Evidence | Risk Level | Proposed Action |
|---|---|---|---|---|---|
| 1 | `backend/server.js` | 663 | `mapApiKey: process.env.MAP_API_KEY \|\| process.env.CARTO_API_KEY \|\| ''` — CartoDB was deprecated due to API key requirement watermark. Fallback is now keyless OSM. | **LOW** | Remove `process.env.CARTO_API_KEY` fallback |
| 2 | `.env.example` & `backend/.env.example` | 14 | `CARTO_API_KEY=` — Confusing obsolete environment variable. | **LOW** | Remove `CARTO_API_KEY=` from `.env.example` |
| 3 | `backend/DEPLOY.md` | 34 | Outdated documentation referencing CartoDB keys. | **LOW** | Clean documentation text |

---

### D. Duplicate Logic

| # | Files Involved | Description | Risk Level | Proposed Action |
|---|---|---|---|---|
| 1 | `backend/services/trackingService.js:140` & `backend/services/geocodingService.js:29` | Identical mathematical formula for `haversineDistanceMeters` vs `haversineDistMeters`. | **LOW** | Import `haversineDistanceMeters` from `trackingService.js` into `geocodingService.js`. |
| 2 | `Dockerfile` & `backend/Dockerfile`, `railway.json` & `backend/railway.json`, `render.yaml` & `backend/render.yaml` | Duplicate configuration files at repo root and inside `backend/`. | **HIGH** | **KEEP BOTH.** Required for monorepo deploy compatibility across Render, Railway, and Docker contexts. |

---

### E. Unused Dependencies

| # | Package | Location | Evidence | Risk Level | Proposed Action |
|---|---|---|---|---|---|
| 1 | `@radix-ui/react-dropdown-menu` | `frontend/package.json` | Not imported in any `.ts`/`.tsx` file in `frontend/src/`. Dropdowns are implemented with lightweight Tailwind state. | **LOW** | `npm --prefix frontend uninstall @radix-ui/react-dropdown-menu` |
| 2 | `@radix-ui/react-select` | `frontend/package.json` | Not imported in any `.ts`/`.tsx` file in `frontend/src/`. Standard HTML `<select>` with Tailwind styling is used throughout modals and topbar. | **LOW** | `npm --prefix frontend uninstall @radix-ui/react-select` |
| 3 | `@radix-ui/react-tabs` | `frontend/package.json` | Only imported in `frontend/src/components/ui/tabs.tsx` (which is dead). If `tabs.tsx` is removed, this package is unused. | **LOW** | `npm --prefix frontend uninstall @radix-ui/react-tabs` |

*Note: In `backend/package.json`, `zod`, `better-sqlite3`, `pg`, `knex`, `bcryptjs`, `jsonwebtoken`, `cors`, `express-rate-limit` are all actively used and verified.*

---

### F. Unused API Routes & DB Schemas (HIGH RISK — Information Only, NEVER Deleted)

The following endpoints are implemented in `backend/server.js` and migrations, but are not yet called by the current web dashboard. They represent intentional architecture for the mobile parent app and Wear OS watch:
1. `POST /api/v1/devices/pairing-code` & `POST /api/v1/devices/pair`: 6-digit Wi-Fi pairing for Samsung Galaxy Watch5 Pro.
2. `POST /api/v1/locations`, `GET /api/v1/locations/latest`, `GET /api/v1/locations/history`: Device batch GPS ingestion and history.
3. `GET /api/v1/geofences`, `POST /api/v1/geofences`, `PUT /api/v1/geofences/:id`, `DELETE /api/v1/geofences/:id`: PostgreSQL/Knex geofence persistence.
4. `POST /api/v1/auth/refresh`: Refresh token rotation.
5. `GET /api/v1/health-measurements/:id`: Historical biometric telemetry.
6. `GET /api/v1/reports`: Server-side aggregate report generation.
7. `GET /api/v1/classes`: Class list querying.
8. `POST /api/v1/parents/children/add`: Parent-child account binding.

**Action:** **KEEP ALL.** Do not delete routes, database tables (`child_safety_tables`, `telemetry_table`), or migrations.

---

### G. Unused Assets

- **Findings:** `backend/public/assets/` contains strictly active Vite bundles (`index-ClCv29ou.js`, `index-DUGrr0zb.css`) and `index.html`. No orphaned images, fonts, or sample media found.
- **Action:** None required.

---

### H. Dockerfile & Build Leftovers

- **Findings:** 
  - Base image: `node:22-alpine` (modern, lightweight).
  - Dependencies: Installed via `npm ci --omit=dev --omit=optional` (excludes `better-sqlite3` native build in production, avoiding python/make/g++ overhead in runtime container).
  - Multi-context files: `Dockerfile` (root) and `backend/Dockerfile` are identical.
- **Action:** Keep both files intact per user instruction to ensure builds succeed regardless of whether the context root is `/` or `backend/`.

---

### I. Security Findings (Information Only, No Secret Values Shown)

1. **`backend/server.js` (line 95):**
   - `app.use(cors());` enables unrestricted Cross-Origin Resource Sharing from any web origin.
   - *Recommendation:* Limit allowed origins via `CORS_ORIGIN` environment variable in production.
2. **`backend/auth.js` (line 4):**
   - Fallback hardcoded JWT secret string used when `process.env.JWT_SECRET` is not set.
   - *Recommendation:* Require `JWT_SECRET` in production or log a warning if the fallback is used.
3. **Committed Scratch Scripts:**
   - `upload_to_github.py` and `direct_github_push.py` contain references to `GITHUB_TOKEN`. Deleting these dead files removes unnecessary script exposure.

---

## Items Needing User Decision

Before proceeding with Phase 2 (Clean Deletions), please review and decide on these 2 items:

1. **`backend/server.py` (889 lines):**
   - *Context:* Python 3 standard library server prototype created before Node.js Express server became primary. The production deployment and all Dockerfiles use `backend/server.js`.
   - *Options:*
     - **A (Recommended):** Delete `backend/server.py` to eliminate 889 lines of duplicate backend logic and prevent drift.
     - **B:** Keep it in repo as a reference prototype.

2. **`frontend/src/components/AttendanceTab.tsx` (177 lines):**
   - *Context:* Pre-fleet attendance table. In the fleet dashboard, attendance information is integrated directly into `StudentsTab.tsx` and `ReportsTab.tsx`.
   - *Options:*
     - **A (Recommended):** Delete `AttendanceTab.tsx` and remove its unused import in `App.tsx:11`.
     - **B:** Keep `AttendanceTab.tsx` unrendered for future use, only removing the dead import in `App.tsx`.

---

## Summary of Proposed Deletions (Pending Approval)

If all **LOW risk** items + **Option A** for the 2 decision items are approved:
- **Files to delete:** 11 files (approx. 1,800+ lines of dead code removed).
- **Dead code in live files:** Clean 7 unused imports, variables, and dead CartoDB keys.
- **Unused dependencies:** Remove 3 unreferenced `@radix-ui` packages from `frontend/package.json`.
- **Zero breaking changes:** All tests (`vitest 40/40`), builds (`tsc && vite build`), and smoke tests (`tools/smoke.js`) will be re-verified after every single commit.

