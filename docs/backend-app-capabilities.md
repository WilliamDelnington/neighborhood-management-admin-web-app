# Neighborhood Management Backend App

**Application:** `neighborhood-management-backend-app`  
**Document purpose:** Describe the services and operational capabilities currently provided by the backend.  
**Reviewed:** 2026-08-11

## Overview

`neighborhood-management-backend-app` is the shared backend for the resident-facing Zalo Mini App and the staff-facing administration web application. It is an API-only Next.js service: it does not render an end-user interface.

The application provides REST APIs, real-time notification events, business rules, authorization, persistence, validation, file handling, reports, and maintenance utilities for neighborhood administration. The current codebase contains 181 API route handlers and 48 persistent domain models.

## Main capabilities

### Identity, access, and administration

- Staff login with phone number and password.
- Resident authentication through Zalo Mini App tokens, with a sandbox mode for development.
- Registration, password setup, logout, current-profile retrieval, and profile updates.
- Feature-flagged OTP request and verification endpoints.
- JWT sessions with session-version checks, allowing logout and administrative session revocation to invalidate existing tokens.
- User creation, editing, account locking, resident search, and assignable-staff lookup.
- Role-based access control with fine-grained `module.action` permissions.
- Role creation, editing, assignment, revocation, and permission discovery.
- Ownership and neighborhood scoping so users see only records they are authorized to access.
- Audit logs for system activity and record-specific histories.

### Neighborhood and address registry

- Neighborhood creation and maintenance.
- Assignment of neighborhood leaders and co-leaders.
- Leader and co-leader assignment histories.
- Street creation, editing, lookup, and staged spreadsheet import.
- Province and ward reference-data endpoints.
- Neighborhood-based record scoping across supported modules.

### Houses, ownership, and occupancy

- House record creation, listing, lookup, editing, deletion, and verification-status changes.
- House ownership records for primary owners, co-owners, and authorized managers.
- Ownership verification and ownership-history management.
- Owner-phone checks used during house and account workflows.
- House attachments and record-specific audit history.
- Relationships from a house to households, businesses, companies, and usage units.
- House usage units for representing separate occupants or uses at one address.
- Protected change requests for proposing updates to controlled data, including decision and cancellation flows.

### Residents, citizens, and households

- Citizen and household CRUD operations with pagination, search, validation, and scoped access.
- Household membership listing and maintained household member counts.
- Household verification and rejection states.
- Resident-record management with record-level audit history.
- AES-256-GCM encryption for sensitive citizen phone and identity-number fields at rest.
- Staged citizen and household spreadsheet imports with preview jobs followed by explicit commit.
- Citizen and household spreadsheet exports.

### Businesses, companies, and organizations

- Business registration, review, status changes, locking, and ownership-aware access.
- Business types and configurable document requirements for each type.
- Submission and staff review of required business documents.
- Business attachments.
- Company creation, maintenance, verification, locking, and house association.
- Organization records used for organizational house ownership.
- Reusable document-type catalog.

### Complaints and resident feedback

- Complaint drafts and final submission.
- Resident-specific complaint lists and public lookup by tracking information.
- Attachments, assignment to staff, status changes, and deletion controls.
- Public and internal processing timelines.
- Resident confirmation of resolution and requests for reevaluation.
- Duplicate-complaint clustering support through a maintenance/backfill utility.
- Complaint spreadsheet export and statistical reporting.
- Scheduled cleanup endpoint for expired complaint drafts.

### Work requests and collaboration

- Creation and management of work requests with one or more recipients.
- Recipient-specific progress updates and personal work queues.
- Due-date metadata, due-soon and overdue summaries, cancellation, and deletion rules.
- Contextual comments and attachments.
- Request-specific audit history.
- Metadata endpoints for building request forms and assignee selectors.

### Communications

- Announcement drafting, editing, attachments, publishing, and deletion.
- Targeting of announcements and notifications to applicable users or groups.
- In-app notification delivery records, unread counts, mark-as-read, and mark-all-read operations.
- Authenticated Socket.IO connections and per-user real-time unread-count events.
- Correspondence types and formal correspondence drafting, sending, attachments, and replies.
- Zalo webhook processing, signature verification, event deduplication, and handling of privacy-related events such as consent withdrawal or data deletion.

### Community activities

- Meeting creation, editing, deletion, publication-related data, attachments, and audit history.
- Resident meeting registration and registration lists.
- Survey creation, editing, opening, closing, deletion, response submission, results, and audit history.
- Duplicate-response protection.
- Survey and meeting reports.
- Support-ticket submission, resident-owned ticket lists, details, attachments, and staff status processing.

### Safety, infrastructure, and compliance

- Fire-safety inspection (`PCCC`) records, attachments, status management, summaries, and audit history.
- A scheduled PCCC deadline check that creates overdue-remediation warnings; its cron schedule is configurable.
- Security-incident records with handling and monitoring states plus audit history.
- Infrastructure-asset registry for items such as roads, drains, lights, and trees.
- Statistical reporting for PCCC and security data.

### Finance and reporting

- Neighborhood income and expense transactions.
- Transaction editing, cancellation, deletion, approval-related states, and summary totals.
- Finance reports.
- Dashboard aggregates and dedicated reports for population, houses, businesses, complaints, meetings, surveys, PCCC, security, and finance.
- Periodic report drafting, editing, submission, and revision-request workflows.
- Excel exports for citizens, households, and complaints; internal PDF-export utilities are also present.

### Files, settings, and data operations

- Generic file/document records with CRUD access controls.
- Attachment upload tokens and multipart attachment uploads.
- Domain-specific attachment authorization and deletion for houses, businesses, complaints, requests, announcements, meetings, correspondence, and PCCC records.
- Application settings and logo management.
- Import-job status tracking and two-phase imports that separate validation/preview from commit.
- Database backup, restore, seed, account-management, migration, repair, and backfill scripts.
- Safety guards that prevent bulk seed-style scripts from running against named production databases.

## Architecture and technology

| Area | Implementation |
| --- | --- |
| Runtime and API framework | Node.js with Next.js 14 App Router and TypeScript |
| HTTP server | Custom Node HTTP server on port `4000` by default |
| Realtime transport | Socket.IO with JWT-authenticated per-user rooms |
| Persistence | MongoDB through Mongoose |
| Authentication | JWT, `bcryptjs`, and Zalo token validation |
| Authorization | Fine-grained RBAC plus ownership and neighborhood scoping |
| Input validation | Zod schemas at API boundaries |
| Sensitive-data protection | AES-256-GCM encryption for selected citizen fields |
| Spreadsheet handling | ExcelJS |
| Scheduling | `node-cron` for in-process scheduled work |
| Testing | Vitest and `mongodb-memory-server` |

API route handlers live under `src/app/api`, delegate business rules to `src/services`, persist through Mongoose models in `src/models`, and validate request data using schemas in `src/validators`. Shared concerns such as authentication, RBAC, encryption, responses, uploads, notifications, and database access are implemented in `src/lib`.

## API behavior

- APIs are exposed below `/api` and generally use standard REST methods.
- Successful JSON responses use a common envelope with `success`, `data`, and an optional `message`.
- Errors use `success: false` with an error/message description and an appropriate HTTP status.
- Validation failures normally return HTTP `422`.
- List endpoints generally support `page` and `limit`; the common default is 20 records and the maximum is 100.
- Protected endpoints expect `Authorization: Bearer <token>`.
- CORS preflight requests are handled centrally, and production origins are configurable.

## Operational safeguards

- Production startup fails when the Zalo webhook secret is missing.
- Production startup also rejects an enabled OTP flow unless a real OTP provider is explicitly marked as configured.
- Locked users and users with an obsolete session version cannot use REST or Socket.IO sessions.
- File names and upload paths are sanitized, and local-file deletion includes path-traversal protection.
- Audit records, ownership checks, status-transition rules, and scoped queries protect sensitive workflows.
- Automated tests cover authentication, permissions, neighborhood scoping, ownership, encryption, verification, attachments, imports, surveys, meetings, and other business rules. The repository currently includes 34 test files.

## Current implementation boundaries

The backend is operationally substantial, but several integrations are intentionally limited:

- In-app notifications are implemented; outbound Zalo Official Account delivery is a placeholder that records failed future-channel deliveries rather than sending messages.
- OTP endpoints are disabled by default, and the delivery adapter is not a production SMS/ZNS integration yet.
- Uploaded files are stored under the backend's local `public/uploads` directory. Multi-instance production deployment would require a shared object-storage adapter such as S3 or GCS.
- The scheduler runs inside the Next.js process, so deployments with multiple application instances need coordination to avoid duplicate scheduled work.
- The service provides REST endpoints and realtime events, but no OpenAPI/Swagger contract is currently generated.
- The code includes internal PDF-export support, while the explicit public export routes currently focus on Excel exports for citizens, households, and complaints.

## Primary consumers

The backend is designed to serve two frontends:

1. `neighborhood-management` uses resident-oriented authentication and workflows such as notifications, complaints, surveys, meetings, support tickets, personal requests, and linked-house access.
2. `neighborhood-management-admin-web-app` uses staff-oriented administration, verification, assignment, reporting, configuration, and audit capabilities.

Together, these APIs form the system of record and workflow layer for neighborhood operations; the frontend applications supply the user experiences appropriate to residents and administrative staff.
