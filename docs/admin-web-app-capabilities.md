# Neighborhood Management Admin Web Application

**Application:** `neighborhood-management-admin-web-app`  
**Development mode:** `npm run dev`  
**Document purpose:** Describe the administrative user interface and workflows currently provided by the application.  
**Reviewed:** 2026-08-11

> The workspace does not contain a separate project named `neighborhood-management-admin-web-dev`. This document treats that name as the development version of `neighborhood-management-admin-web-app`.

## Overview

The Neighborhood Management Admin Web Application is a browser-based workspace for neighborhood officers and other authorized staff. It provides the administrative interface for the shared neighborhood-management backend, including master-data maintenance, resident and property records, operational case handling, communications, reporting, and system administration.

The application is a React single-page application with 67 page components. Its menu, routes, controls, and available actions adapt to the permissions of the signed-in user. It does not store the authoritative business data itself; it reads and changes that data through the backend REST APIs.

## User experience and application shell

- Phone-number and password sign-in for staff accounts.
- Persistent browser sessions backed by a JWT stored in local storage.
- Automatic restoration of the signed-in user when the application starts.
- Automatic local logout when the backend rejects an expired or invalid session.
- Responsive navigation with a desktop sidebar and mobile drawer.
- Permission-filtered navigation grouped by business area.
- Collapsible menu groups whose expanded state persists across page reloads.
- Global loading states, empty states, error states, confirmation dialogs, pagination, badges, tabs, forms, tables, and toast messages.
- A notification bell with unread counts, notification listing, mark-read actions, and real-time count updates through Socket.IO.
- Application branding and logo supplied by configurable backend settings.

## Administrative capabilities

### Dashboard

- High-level operational and statistical summary cards.
- Shortcuts to modules the user is allowed to access.
- Counts and summaries sourced from the backend dashboard service.
- Permission-aware presentation so unavailable modules are not offered as shortcuts.

### Neighborhoods and leadership

- List, create, view, and edit neighborhood records.
- Assign a neighborhood leader.
- Add and remove co-leaders.
- Review leader and co-leader assignment histories.
- Use province and ward reference data when maintaining addresses.
- Require an appropriate neighborhood assignment before scoped staff can enter the protected application.

### Streets and infrastructure

- List, search, create, view, and update streets.
- Import streets from a spreadsheet through upload, field mapping, preview, and commit stages.
- Maintain an infrastructure register for neighborhood assets such as roads, lights, drains, and trees.
- Create, edit, view, filter, and remove infrastructure records according to permission.

### Houses and ownership

- Search and filter house records.
- Create, view, edit, delete, verify, or reject a house when authorized.
- Check whether an owner phone number already belongs to an existing account.
- View a house's households, businesses, companies, attachments, and audit history.
- Add and maintain usage units within a house.
- Record primary owners, co-owners, and authorized managers.
- Verify ownership records and end an ownership relationship.
- Transfer a house to another neighborhood through a dedicated workflow.
- Open related household, business, and company detail pages within the house context.

### Households and citizens

- Create and edit household records from the house workflow.
- View household details and household members.
- Verify or reject household records.
- Add, edit, and remove citizen records according to access rights.
- Select a head of household and associate resident user accounts.
- Use reusable household and house pickers in related administrative forms.

### Resident records

- List and filter residence records.
- Create temporary- or permanent-residence records.
- Edit and delete residence records.
- Review the audit history of an individual residence record.

### Organizations, businesses, and companies

- Maintain organizations that can act as house owners.
- List, filter, create, view, edit, and delete household businesses.
- Review and change business verification or operating status.
- Display and review business attachments and required documents.
- Maintain business types and configure document rules for each type.
- List, filter, create, view, edit, and delete companies.
- Review and change company verification or lock status.
- Associate businesses and companies with houses.

### Complaints and feedback processing

- Search and filter resident complaints.
- Open a complaint detail workspace with its content, submitter information, attachments, and timeline.
- Assign a complaint to eligible staff.
- Move complaints through permitted processing statuses.
- Review resident confirmation or reevaluation activity.
- Delete complaints when the user's permission and the record state allow it.

### Support tickets

- View and filter support requests submitted by residents.
- Inspect ticket details and attachments.
- Update the administrative handling status.
- Separate resident-owned views in the underlying workflow from the staff processing queue.

### Work requests

- Create and send work requests to one or more recipients.
- Select recipients by assignment eligibility and business role.
- Set request metadata and due dates.
- View sent requests and a separate "My requests" inbox for assigned work.
- Open request details in a reusable side panel.
- Update recipient progress, confirm completion, and cancel requests where allowed.
- Add contextual comments and attachments.
- Review request-specific audit history.

### Change requests

- Review requests to change protected resident or property information.
- Inspect proposed changes before making a decision.
- Approve or reject requests according to permission.
- Use status and record filters to manage the review queue.

### Fire safety and security

- Create, list, filter, edit, and delete fire-safety (`PCCC`) inspection records.
- Display fire-risk summaries.
- Upload and review inspection attachments.
- Review PCCC record history.
- Create and maintain security-incident records.
- Track handling and monitoring information for security cases.
- Review security record history.

### Meetings

- List and filter neighborhood meetings.
- Create and edit meeting schedules and content.
- Manage meeting attachments.
- View resident registrations.
- Review meeting-specific audit history.

### Announcements

- List and filter announcements.
- Create and edit announcement content and targeting.
- Upload and remove attachments.
- Publish announcements to their intended audience.
- Review publication and delivery-related information returned by the backend.

### Surveys

- List, filter, create, and edit surveys.
- Configure survey questions and audience information.
- Open and close a survey.
- View response results and summaries.
- Review survey audit history.

### Correspondence and document catalogs

- Maintain correspondence types and document types.
- Draft and edit formal correspondence.
- Select eligible correspondence types based on the sender's authority.
- Add and remove correspondence attachments.
- Send correspondence and review its detail.
- Read and add contextual replies.
- Maintain a shared library of forms and files with create, edit, and delete operations.

### Finance

- List and filter income and expense transactions.
- Create and edit finance transactions.
- Cancel or delete transactions when allowed.
- Display financial summary totals for the selected scope or period.

### Reporting

- View consolidated reports for population, houses, businesses, complaints, PCCC, security, and finance.
- View meeting- and survey-specific reports.
- Filter reports by the supported period and neighborhood criteria.
- Present report data with summary cards, tables, and bar charts.
- Download supported reports as Excel files.
- Draft and maintain periodic reports.
- Submit periodic reports and request revisions as part of their workflow.

### Users, roles, and permissions

- List and filter user accounts.
- View and edit user information.
- Create a dedicated house-owner account and connect it to the appropriate house context.
- Lock or unlock accounts.
- Revoke a user's active sessions.
- Assign and revoke user roles.
- Create, view, edit, and delete custom roles.
- Configure role permissions from the backend's permission registry.

### Settings, Mini App features, and audit

- View and update application settings.
- Upload, replace, or remove the application logo.
- Review the catalog and ordering of resident Mini App features.
- Browse system-wide audit logs with administrative filters.

## Permission and scope model

The application applies authorization at several user-interface layers:

1. A user must have a valid authenticated session to enter the administrative area.
2. Protected routes declare the permissions required to open them.
3. The sidebar excludes modules for which the user lacks the corresponding read permission.
4. Buttons and workflow actions are conditionally displayed based on create, update, delete, approve, publish, assign, or other action permissions.
5. Staff who require a neighborhood assignment are prevented from entering scoped workflows without one.
6. The backend remains the final authority and rechecks permissions, ownership, scope, and state transitions for every request.

Hiding a menu item is therefore a usability measure, not the security boundary.

## Architecture and technology

| Area | Implementation |
| --- | --- |
| UI framework | React 18 with TypeScript |
| Build and development server | Vite 5 |
| Routing | React Router 6 with lazy-loaded pages |
| Client state | Zustand for authentication/session state |
| Styling | Tailwind CSS |
| UI primitives | Radix UI components following the shadcn/ui pattern |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | Sonner toasts and Socket.IO realtime events |
| Date utilities | date-fns |
| API access | A shared wrapper around the browser `fetch` API |

The source is organized by responsibility:

- `src/pages` contains business pages and workflows.
- `src/components/admin` contains reusable domain components such as pickers, attachment panels, request panels, pagination, charts, and record history.
- `src/components/auth` contains authentication, permission, role, and neighborhood-assignment guards.
- `src/components/layout` contains the application shell and notification bell.
- `src/service` contains typed API clients for each backend domain.
- `src/constants` centralizes routes, menu modules, labels, and shared domain values.
- `src/store` owns authentication state and permission helpers.

## Backend integration behavior

- The backend base URL comes from `VITE_BASE_URL`; local development defaults to `http://localhost:4000`.
- Requests automatically include the bearer token unless an endpoint is explicitly public.
- GET parameters are converted to a query string, while mutation payloads are serialized as JSON.
- Multipart upload helpers are used where files must be transferred.
- The shared request layer interprets the backend's standard success/error response envelope.
- HTTP `401` responses clear the local session automatically.
- Domain API clients keep endpoint details out of page components.
- Socket.IO uses the same JWT to authenticate real-time notification updates.

## Development and delivery

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server, normally on port `5173` |
| `npm run start:remote` | Start Vite with the remote environment configuration |
| `npm run build` | Type-check the project and create the production bundle |
| `npm run build:remote` | Build using the remote environment configuration |
| `npm run preview` | Preview the production bundle locally |
| `npm run lint` | Run ESLint over the source tree |
| `npm run format` | Apply Prettier formatting |

Production output is a static single-page application in `dist`. It requires a web host configured to serve `index.html` for client-side routes and access to a compatible `neighborhood-management-backend-app` deployment.

## Current implementation boundaries

- The application is an administrative interface, not the resident-facing Mini App.
- Authentication currently uses staff phone/password login; there is no separate administrative OTP screen.
- Business data and access decisions depend on the backend being available.
- The JWT is persisted in browser local storage, so deployment should enforce HTTPS and a strong content-security policy and should minimize exposure to injected scripts.
- The application has no dedicated automated frontend test suite in its package scripts; type-checking, linting, production builds, and manual workflow validation are the current verification mechanisms.
- Report export availability depends on the specific report endpoint supported by the backend.
- File display and upload behavior depends on backend storage and attachment authorization.
- The Mini App feature page documents or configures feature visibility/order; it does not implement the resident features themselves.

## Relationship to the other applications

- `neighborhood-management-backend-app` is the system-of-record and business-rule layer used by this admin interface.
- `neighborhood-management` is the resident-facing Zalo Mini App.
- `neighborhood-management-admin-web-app` gives authorized staff the tools to administer the records and process the workflows exposed to residents.

The admin application is therefore the staff operations surface of the wider neighborhood-management system: it turns backend capabilities into permission-aware screens for review, assignment, verification, communication, reporting, and configuration.
