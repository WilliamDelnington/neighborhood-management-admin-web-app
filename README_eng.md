# Hòa Bình Admin — Hòa Bình Residential Group Admin Dashboard

A web admin single-page application (SPA) for the staff of the "Hòa Bình" residential group (Tổ dân phố), used to manage households, residents, resident complaints, fire-safety (PCCC) checks, security records, neighborhood meetings, announcements, surveys, finance, and consolidated reports. Built with **React + TypeScript + Vite**, it talks to the [Hòa Bình Backend App](../quan-ly-to-dan-pho-hoa-binh-backend-app) over REST, authenticates via JWT, and enforces fine-grained per-module role-based access control (RBAC).

## Table of contents

- [Feature overview](#feature-overview)
- [Architecture & tech stack](#architecture--tech-stack)
- [System requirements](#system-requirements)
- [Installation](#installation)
- [Environment configuration](#environment-configuration)
- [Running the project](#running-the-project)
- [Project structure](#project-structure)
- [Path aliases](#path-aliases)
- [Authentication & authorization](#authentication--authorization)
- [Talking to the API](#talking-to-the-api)
- [Usage examples](#usage-examples)
- [Code style conventions](#code-style-conventions)

## Feature overview

The sidebar shows only the modules the logged-in account has permission for (see [src/constants/modules.ts](src/constants/modules.ts)):

| Module | Path | Required permission |
| --- | --- | --- |
| Dashboard | `/` | `dashboard.read` |
| Houses | `/houses` | `houses.read` |
| Business types | `/business-types` | `business_types.read` |
| Complaints | `/complaints` | `complaints.read` |
| Fire safety (PCCC) | `/pccc` | `pccc.read` |
| Security / temporary residence | `/security` | `security.read` |
| Meetings | `/meetings` | `meetings.read` |
| Announcements | `/announcements` | `announcements.read` |
| Surveys | `/surveys` | `surveys.read` |
| Forms & files | `/files` | `files.read` |
| Finance | `/finance` | `finance.read` |
| Reports | `/reports` | `reports.read` |
| Users & roles | `/users` | `users.read` |
| Roles & permissions | `/roles` | `roles.read` |
| Settings | `/settings` | `settings.read` |

Each list module supports search and pagination, and — depending on the module — create/edit/delete, household/house detail views, complaint assignment, survey results, and report export.

## Architecture & tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 + TypeScript, bundled with Vite 5 |
| Routing | React Router v6 (each page is lazy-loaded via `React.lazy`) |
| Session state | Zustand (`useAuthStore`), token persisted in `localStorage` |
| UI components | Radix UI primitives (`@radix-ui/*`) combined with Tailwind CSS, following the shadcn/ui pattern (`components.json`) |
| Styling | Tailwind CSS + `tailwindcss-animate`, class merging via `clsx` + `tailwind-merge` (the `cn` helper in `@lib/utils`) |
| Icons | lucide-react |
| Toast notifications | sonner |
| Date handling | date-fns |
| API calls | Plain `fetch`, wrapped by the `request()` helper in [src/service/request.ts](src/service/request.ts) |
| Lint/Format | ESLint (airbnb config) + Prettier |

## System requirements

- Node.js 18+ (20+ recommended)
- npm
- A running instance of the [Hòa Bình Backend App](../quan-ly-to-dan-pho-hoa-binh-backend-app) (defaults to `http://localhost:4000`) to provide data

## Installation

```bash
git clone <repo-url>
cd quan-ly-to-dan-pho-hoa-binh-admin
npm install
```

## Environment configuration

Copy the example file and fill in the appropriate value:

```bash
cp .env.example .env.development
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_BASE_URL` | ✅ | Base URL of the backend API, e.g. `http://localhost:4000` in dev, or the real domain in production |

Vite automatically loads `.env.development` when running `npm run dev`, and `.env.production` when building for production (see [Vite env modes](https://vitejs.dev/guide/env-and-mode.html)).

## Running the project

```bash
# Development mode (port 5173, see vite.config.ts)
npm run dev

# Type-check + production build into dist/
npm run build

# Preview the production build
npm run preview

# Lint the whole src/ directory
npm run lint

# Check formatting only (no writes)
npm run check-format

# Auto-format the codebase (Prettier --write)
npm run format
```

After running `npm run dev`, open `http://localhost:5173` and sign in with a staff account (phone number + password) already seeded/created on the backend.

## Project structure

```
src/
  components/
    admin/        Shared business components (Pagination, StatCard, HousePicker, ...)
    auth/          Route guards: RequireAuth, RequireRole, RequirePermission, AdminGuard
    layout/        Main shell layout (sidebar + header) — AdminLayout
    ui/            Base UI components following shadcn/ui (button, dialog, table, select, ...)
  constants/       Constants: modules.ts (sidebar menu), domain.ts (enum labels), common.ts (API routes)
  lib/             Shared utilities (the cn() Tailwind class-merging helper)
  pages/           One subfolder per business module (List/Form/Detail pages)
  service/         One *Api.ts file per API group, all using the shared request() helper
  store/           Zustand stores (authStore.ts — token, user, bootstrap state)
  types/           Shared TypeScript definitions (User, Role, ApiResponse, ...)
  App.tsx          Route declarations, wraps protected areas with AdminGuard
  main.tsx         Application entry point
```

## Path aliases

Configured in [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json):

| Alias | Maps to |
| --- | --- |
| `@components/*` | `src/components/*` |
| `@constants/*` | `src/constants/*` |
| `@pages/*` | `src/pages/*` |
| `@service/*` | `src/service/*` |
| `@store/*` | `src/store/*` |
| `@lib/*` | `src/lib/*` |
| `@dts` / `@dts/*` | `src/types` |

## Authentication & authorization

- Sign in with phone number + password (`POST /api/auth/login`, see [src/service/authApi.ts](src/service/authApi.ts)); the backend returns a JWT. The token is persisted to `localStorage` (key `hb_admin_token`) via `useAuthStore`.
- On app start, if a token is already present, `App.tsx` calls `fetchMe()` to reload the user (`GET /api/auth/me`); if that fails (expired/invalid token), the app logs out automatically.
- Every route under the admin area is wrapped by `AdminGuard` ([src/components/auth/AdminGuard.tsx](src/components/auth/AdminGuard.tsx)):
  - `RequireAuth`: redirects to `/login` if not authenticated.
  - `RequirePermission`: checks whether `user.permissions` contains the required permission (in `module.action` form, e.g. `citizens.create`); shows `AccessDenied` otherwise.
  - `RequireRole`: legacy role-based check, kept for backward compatibility.
- The sidebar (`AdminLayout`) only renders the entries in `MODULES` for which `user.permissions` includes the matching permission — modules the user can't access are hidden entirely, not just route-blocked.
- To protect a new page by permission, wrap its route with `<RequirePermission permissions={["module.action"]}>`, or follow the same pattern already used for the existing routes in `App.tsx`.

## Talking to the API

Every request goes through the `request()` helper in [src/service/request.ts](src/service/request.ts):

- Automatically attaches the `Authorization: Bearer <token>` header when `useAuth` is true (the default).
- For `GET`, object parameters are turned into query string params (skipping `undefined`/`null`/empty values).
- For other methods, the body is JSON-serialized.
- Backend responses always follow the `{ success, data, message }` / `{ success: false, error, message }` shape (`ApiResponse<T>`, see `src/types/index.ts`); a `success: false` response throws a `RequestError`, and a `401` status triggers an automatic logout.

Endpoints are declared centrally in [src/constants/common.ts](src/constants/common.ts) (`API.*`); each business area has its own `service/<name>Api.ts` file calling into the matching endpoints.

## Usage examples

### Signing in

```
Phone:    0912345678
Password: HoaBinh@2026   (default backend seed password — dev/demo only)
```

On successful login, the app redirects back to the page that was originally requested (if blocked by `RequireAuth`), or to `/`.

### Adding a new API service

```ts
// src/service/exampleApi.ts
import { API } from "@constants/common";
import { request } from "./request";
import { Example } from "@dts";

export const fetchExamples = (params: { page: number; limit: number }) =>
    request<{ items: Example[]; total: number }>("GET", API.EXAMPLES, params);

export const createExample = (payload: Partial<Example>) =>
    request<Example>("POST", API.EXAMPLES, payload);
```

### Adding a new permission-gated page

```tsx
// src/App.tsx
const ExampleListPage = React.lazy(() => import("@pages/Example/ExampleListPage"));

// Inside <Route element={<AdminGuard permissions={["dashboard.read"]}><AdminLayout /></AdminGuard>}>
<Route path="/examples" element={<ExampleListPage />} />
```

```ts
// src/constants/modules.ts — add to the MODULES array to show it in the sidebar
{
    key: "examples",
    label: "Examples",
    path: "/examples",
    icon: FileText,
    permission: "examples.read",
},
```

### Checking a permission inside a component

```tsx
import { usePermission } from "@store/authStore";

const canCreate = usePermission("citizens.create");

{canCreate && <Button onClick={openCreateDialog}>Add resident</Button>}
```

## Code style conventions

- ESLint based on `eslint-config-airbnb` + `eslint-config-prettier`, run via `npm run lint`.
- Prettier configured in [.prettierrc.js](.prettierrc.js); run `npm run format` to auto-format, `npm run check-format` to check only.
- `npm run build` runs `tsc --noEmit` before the Vite build — type errors will block the build.
