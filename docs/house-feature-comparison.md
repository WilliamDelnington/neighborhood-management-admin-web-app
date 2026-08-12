# House module feature comparison (C01-C14)

**Requirements source:** `refered-documents/Đặc tả nghiệp vụ phân hệ Nhà số.docx`  
**Applications reviewed:** `neighborhood-management` (Zalo mini app), `neighborhood-management-backend-app`, and `neighborhood-management-admin-web-app`  
**Review date:** 2026-08-10

## Assessment convention

| Status | Meaning |
| --- | --- |
| Available | The three applications together provide the complete House-facing flow, including UI, API/data, authorization, state transitions, and required output. |
| Partially available | A reusable model, API, screen, or some workflow steps exist, but at least one material House-specific requirement is missing. |
| Unavailable | No usable model/API/UI exists for the feature's core workflow. |

An admin screen or a generic API alone is not enough for an **Available** result. The specification's Definition of Done requires House-level authorization (`ADDRESS_SELF` semantics), validation, state transitions, attachments/audit/notifications where applicable, a mobile UI, and security tests.

## Executive result

| Status | Count | Modules |
| --- | ---: | --- |
| Available | 0 | None |
| Partially available | 13 | C01-C06, C08-C14 |
| Unavailable | 1 | C07 |

The system already has substantial generic functionality, but no C01-C14 module is fully compliant end to end. The strongest foundations are C02 (house data/change requests), C04 (notifications), C06 (complaints), C08 (surveys), C09 (meetings), and C10 (support tickets).

## Result by House module

| Code | Requirement module | Overall status | `neighborhood-management` | Backend app | Admin web app | Main missing requirements |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | House dashboard | **Partially available** | Has a general home page, feature cards, announcements, meetings, surveys, complaints, support, and separate “my requests” pages. | Has a staff/statistical dashboard and request due/overdue counts, but no `me/dashboard` House aggregate. | Has an administrative dashboard, not a House action dashboard. | No House-centric “work to do” aggregate, due-soon priority, active complaint status, inspection target, or unified cards scoped to the linked House. |
| C02 | My house | **Partially available** | Has house list/detail/form under the permission-based `/admin` area, ownership display, and change-request creation/history. It is not a dedicated “My house” experience. | `HouseRecord` supports address, street, neighborhood, verification status, owner-based access filtering, audit logs, ownerships, attachments, usage units, households, businesses, and companies. Approved `ChangeRequest` can apply protected changes. | Strong staff-side house list/detail/create/edit/history, ownership, transfer, and related-record management. | No dedicated self-profile API/UI, QR opaque token, map marker/correction flow, House member roles/invitations, representative verification workflow, or public-safe House history. Existing change requests are generic and do not implement the full DRAFT → neighborhood → ward → applied workflow. |
| C03 | Neighborhood information | **Partially available** | Can call neighborhood APIs, but has no resident-facing page linked from “My house.” | Neighborhood records and leader/co-leader assignment/history APIs exist. | Full staff management for neighborhood, leader, co-leaders, and contact fields. | No public-safe neighborhood profile API/UI, configured public contact policy, public schedule, guidance/rules, or meeting-place presentation for House users. |
| C04 | Receive notifications | **Partially available** | Has notification list, unread count, detail navigation, and mark-read behavior; announcements have list/detail views. | Has `Notification`/`NotificationDelivery`, recipient generation, unread/read APIs, target roles/clusters/users, announcement publishing, and protected attachment routes. | Can create/publish announcements and inspect delivery statistics; also has a notification bell for staff. | No separate acknowledgement (`acknowledged_at`), explicit Ward/Tổ/emergency inbox filters and emergency pinning, or verified House-recipient attachment policy matching the specification. |
| C05 | Work to do / assigned tasks | **Partially available** | Has “My requests,” request detail, recipient-status updates, notes, comments, and attachments. | `Request`/`RequestRecipient` support assignees, due dates, attachments, comments, per-recipient status, “my requests,” due-soon/overdue counts, and confirmation. | Can create/send requests, manage recipients, view details/history, and work with assigned requests. | The model is staff/user-request oriented rather than `Task`/`TaskAssignment`/`TaskResult` for a House. Missing House/User assignment semantics, RECEIVED → IN_PROGRESS → SUBMITTED → REVISION_REQUIRED lifecycle, evidence/result submission, unable-to-complete action, and House-facing timeline language. |
| C06 | Feedback / petitions | **Partially available** | Strong citizen flow: draft/create, category/content, attachments, location data, lookup/list/detail timeline, confirm resolution, and request reevaluation. A staff inbox also exists. | `Complaint` plus timeline, assignment, status, attachments, public/internal timeline filtering, confirm resolution, and reevaluation are implemented. | Staff list/detail, assignment, status processing, attachments, and timeline are available. | No House-derived neighborhood routing with explicit anti-tampering semantics, `WAITING_FOR_INFO` supplement action, structured rating, separate reopen-request entity/policy, full GPS/map choices, or exact public status sequence required by C06. |
| C07 | Inspection / self-declaration | **Unavailable** | No inspection/campaign/target/form pages or API client. | No `InspectionCampaign`, `InspectionTarget`, `InspectionResult`, or `InspectionAnswer` model/API. PCCC records are administrative assets, not a House self-declaration campaign engine. | No campaign rollout, dynamic self-declaration form, evidence review, revision request, or House verification UI. | The complete domain and workflow are absent. |
| C08 | Surveys | **Partially available** | Survey list/detail and response submission exist. | Survey create/open/close/respond/results exist; questions and a unique `(surveyId, userId)` response constraint are present; targeting supports roles/clusters. | Staff can create surveys, open/close them, review history, and view results. | One response is enforced per user, not configurable per House; no explicit House target/participation state, anonymous-policy handling, complete question types/required validation semantics, or tabs exactly matching new/answered/closed. |
| C09 | Community meetings | **Partially available** | Meeting list/detail and registration/RSVP are available. | Meetings support schedule/content, minutes text, attachments, recipient grouping, and one registration per user. | Staff can create/manage meetings, attachments, history, and registrations. | No `MeetingParticipant` House invitation model, pre-meeting opinions, voting/eligibility, result publication gate, RSVP values required by the spec, or published-minutes-only rule. |
| C10 | Support requests | **Partially available** | Users can create, list, view, and track support tickets with attachments. | `SupportTicket` supports owner-scoped list/detail, create, attachments, administrative status updates, and notifications/audit. | Staff list/detail and status processing exist. | Ticket types are currently error/feedback oriented, not configurable House-support categories. Missing House-derived neighborhood routing, NEED_MORE_INFO supplement flow, Tổ → Ward timeline, public result semantics, and distinct approved versus completed presentation. |
| C11 | Report local incidents | **Partially available** | Complaint creation can be reused and accepts category/location/attachments, but there is no quick incident shortcut/form. | Complaint and infrastructure-asset foundations exist. | Complaints can be processed and infrastructure assets managed. | Missing the prescribed shortcut categories (street light, road/alley, drainage, tree, waste, fire-safety point), optimized GPS/photo-first form, and explicit reuse mapping to the feedback timeline. |
| C12 | Contextual conversation | **Partially available** | Request detail supports comments; other House flows mainly expose status timelines rather than conversations. | Request comments and correspondence replies exist, but there is no generic authorized `Comment`/`CommentRead` mechanism for Task, Feedback, and SupportRequest. | Request detail supports staff comments/attachments. | Conversation is not consistently available across task, complaint, and support contexts; no read receipts, entity-level access contract, or comment-linked attachment model across all three domains. |
| C13 | Interaction history | **Partially available** | Separate histories/lists exist for notifications, requests, complaints, surveys, meetings, support, and change requests. | Source records and audit/timeline data exist in several domains. | Staff history pages exist for houses, requests, meetings, surveys, residents, and other records. | No unified House read model/API/UI aggregating all C13 domains with type/date/status filters; inspection history is absent. |
| C14 | Account and privacy | **Partially available** | Account profile exists; users can request selected identity changes and view their change requests. Authentication supports login/OTP and password setup. | User/auth, OTP verification, password setup, owner associations, generic change requests, role/session revocation, and owner-house filtering exist. | Staff can manage users, create a house-owner account, lock users, and revoke a user session. | No House representative registration/replacement workflow, member invitations/revocation/history, self unlinking, notification preferences, self-service password change, device/login history, revoke-current/all sessions, consent/privacy center, or verified phone/email update flow matching C14. |

## What is already reusable by application

### `neighborhood-management`

- Citizen-facing notifications and announcements.
- Complaint creation, attachments, lookup, detail timeline, confirmation, and reevaluation request.
- Survey participation.
- Meeting browsing and registration.
- Support ticket creation and tracking.
- Assigned-request list/detail/status/comments.
- Change requests and permission-gated house administration screens.

The principal issue is information architecture and semantics: these are separate generic utilities, not a coherent House workspace scoped to the user's verified linked House.

### `neighborhood-management-backend-app`

- Verified-house access filtering for house-owner users and protected changes through `ChangeRequest`.
- House, street, neighborhood, ownership, attachments, audit, households, businesses, companies, and usage units.
- Notification delivery/read tracking.
- Requests with recipients, due dates, status, comments, attachments, and personal queues.
- Complaints with workflow/timeline/attachments/reevaluation.
- Surveys, meetings/registrations, and support tickets.

The backend lacks a first-class House membership/representative model and several specification domains: inspection/self-declaration, generic contextual comments/read receipts, unified House history, QR, preferences, and self-service session/privacy management.

### `neighborhood-management-admin-web-app`

- Strong staff-side house master-data administration and history.
- Neighborhood leader/co-leader administration.
- Announcement publishing and delivery visibility.
- Request assignment and tracking.
- Complaint processing.
- Survey creation/results, meeting management, and support-ticket processing.
- Change-request review.

This is appropriately an administrative surface, but the House specification also needs it to supply the review/approval side of new House workflows, especially representative/member linkage, two-stage house-data correction, task-result review, inspection verification, feedback supplements/ratings/reopen decisions, and support escalation.

## Highest-priority gaps

1. **Harden the existing House linkage (C14):** reuse `HouseOwnership` and its acting-owner scope as the initial representative mechanism; expose a single authoritative authorization helper across every House-facing domain and add IDOR tests. Add a separate member/invitation/delegation model only if non-owner `HOUSE_MEMBER` access is required.
2. **Dedicated “My house” and House dashboard (C02, C01, C03):** build the mobile House workspace and aggregate API only after the linkage model is authoritative.
3. **House task lifecycle (C05):** adapt or replace `Request` with House/User assignments, result/evidence submission, revision, and unable-to-complete handling.
4. **Close communication workflow gaps (C04, C06, C10, C12):** acknowledgement, supplements, ratings/reopen decision, House-derived routing, and contextual comments/read receipts.
5. **Build inspection/self-declaration (C07):** this is the only module with no meaningful implementation foundation.
6. **Extend community functions (C08, C09, C11, C13):** House-level uniqueness/targeting, opinions/votes/publication controls, quick incident taxonomy, and unified history.

## Build-necessity recommendation

This prioritization is about the first operational House release. **Unnecessary** means “do not build as a separate feature now,” not that the underlying business requirement can never become useful.

### Necessary — build for the first operational release

| Feature | Existing foundation | Minimum work still required | Why necessary |
| --- | --- | --- | --- |
| House authorization based on the existing ownership relationship (C14 core) | `HouseOwnership` already supports active primary owners, co-owners, and authorized managers; `getHouseIdsForActingOwner`, `isHouseOwnerActor`, and `assertHouseRecordInScope` already derive and enforce House scope. | Reuse these as the authoritative scope in every House-facing service; verify ownership status rules; expose self-service linkage/revocation only where needed; add cross-domain IDOR tests. Build a separate member/invitation model only if limited non-owner `HOUSE_MEMBER` access is in the approved release scope. | Reliable House-level authorization is necessary, but replacing the existing ownership model is not. |
| “My house” read-only profile (C02 core) | House record, address, street, neighborhood, status, ownership, audit, and staff administration. | Dedicated owner/member API and mobile page; public-safe fields; representative and linked-member summary; clear verification status. | This establishes the House context and lets users verify the official data used by all later workflows. |
| House-data correction request (C02.11 core) | Generic change requests and staff decision UI. | House-specific allowed fields, attachments/reason, neighborhood/ward review stages, application of approved changes, public status/history, and notification. | Residents must not edit master data directly, but they need a safe correction path. |
| Basic House action dashboard (C01 core) | General home cards and source-domain list APIs. | `GET /me/dashboard` aggregate with unread notifications, assigned work, due-soon work, active complaints, open support, surveys, and meetings, all scoped to authorized Houses. | It is the practical entry point for residents and prevents important work from being hidden in separate menus. |
| Official notifications (C04 core) | Delivery records, unread count, mark-read, announcements, and attachments. | House-recipient authorization for detail/files, Ward/Tổ source labels, emergency priority, required acknowledgement where configured, and basic inbox filters. | This is the delivery channel for tasks, results, revision requests, meetings, and urgent information. |
| House task execution (C05 core) | Requests, recipients, due dates, comments, attachments, personal queue, and status updates. | House/User assignment; receive/start/submit/revise states; result text/evidence; unable-to-complete reason; staff review; House-safe timeline. | The House cannot operationally receive and complete work from the Tổ/Phường without it. |
| Feedback completion (C06 core) | Citizen complaint creation, attachments, timeline, assignment, resolution confirmation, and reevaluation request. | Derive House/Tổ on the server; supplement flow; public result; safe status wording; attachment authorization; anti-tampering tests. | This is the principal bottom-up resident-to-government workflow and is already close to usable. |
| Support completion (C10 core) | Owner-scoped ticket create/list/detail, attachments, staff status processing, audit, and notifications. | Configurable support categories; derive House/Tổ; NEED_MORE_INFO supplement; Tổ-to-Ward handoff; public result and timeline. | Residents need a channel for assistance that is not incorrectly treated as a complaint or application error. |
| Cross-cutting security and state-transition tests | Some service-level ownership and status checks exist. | Implement the eight mandatory House security tests plus attachment authorization and representative/member permission tests. | The specification treats these as Definition-of-Done requirements, and House data contains sensitive personal relationships. |

### Partly necessary — build after the core release or when the business process is activated

| Feature | Recommended scope | Reason to defer |
| --- | --- | --- |
| Public neighborhood information (C03) | Initially show name/code, published leader contact, and meeting point; add schedules/guidance later. | Useful context but does not block House identity, tasks, feedback, or support. |
| Inspection/self-declaration (C07) | Build the full campaign/target/dynamic-form/result/revision domain when the first real campaign is confirmed. | It is completely absent and comparatively expensive. Building a generic form engine without a confirmed campaign risks over-design. |
| Survey House semantics (C08) | Add House targeting, optional one-response-per-House, required validation, and participation tabs. | Current per-user surveys already provide basic participation. |
| Meeting extensions (C09) | Add House invitations and published minutes first; add pre-meeting opinions, voting, eligibility, and result publication only when required. | Current view/registration flow covers the common meeting use case. |
| Incident shortcut (C11) | Add quick categories and a GPS/photo-first screen that creates a normal complaint. | The complaint workflow already handles the underlying case; only convenience and taxonomy are missing. |
| Contextual conversation (C12) | Reuse/standardize comments for tasks, feedback, and support; add attachments. Read receipts can follow later. | Status timelines and existing request comments can support the initial release. |
| Unified interaction history (C13) | Start with links to existing domain histories; add an aggregate read-model only if users need cross-domain search/filtering. | Source histories already exist, so a unified feed is convenience rather than a transaction blocker. |
| Advanced account/privacy controls (C14 extensions) | Member invitation, delegation, notification preferences, device/session history, all-device logout, and consent view. | Core representative authorization must come first; these controls can be layered onto a stable membership model. |

### Unnecessary for the first release — reuse, simplify, or omit

| Feature | Recommendation | Rationale |
| --- | --- | --- |
| Separate C11 incident backend workflow | **Do not build.** Reuse C06 complaints with incident categories and a shortcut UI. | The specification itself recommends reuse, and a second workflow would duplicate assignment, timeline, attachment, and result logic. |
| Separate `InteractionHistory` database table for C13 | **Do not build initially.** Aggregate existing records as a read model. | A duplicated history table creates synchronization and retention problems without adding transactional value. |
| Free-form resident chat | **Do not build.** Keep comments attached to a task, complaint, or support request. | The specification explicitly rejects free chat; contextual conversations are safer and easier to authorize. |
| Complex statistical resident dashboard | **Do not build.** Use action cards and counts only. | C01 is an action dashboard; staff analytics already belong in the admin application. |
| Fourteen equal mobile navigation items | **Do not build.** Keep Home, My House, Feedback, Work, Utilities, and Account. | The specification explicitly recommends a compact mobile information architecture. |
| Dedicated new Task platform if `Request` can be safely extended | **Avoid unless a design review proves the models incompatible.** | Reusing recipients, due dates, comments, attachments, audit, and personal queues reduces cost and migration risk. |
| House QR in the core release | **Defer.** Add only with a confirmed scan/use case and an opaque, revocable token. | QR does not enable a core business transaction and introduces public-access and privacy risks. |
| Editable resident map/GPS master data | **Do not allow.** Show a marker later and route corrections through a change request. | Direct edits violate the master-data and verification rules. |
| Complaint rating | **Defer.** Keep resolution confirmation and reevaluation first. | Rating is useful for service quality but does not block complaint resolution. |
| Meeting voting and pre-meeting opinions | **Defer until a real meeting policy requires them.** | Eligibility, one-vote rules, anonymity, and result publication add significant authorization complexity. |
| Video uploads | **Defer unless operationally required.** Start with images and documents. | Video increases storage, upload reliability, moderation, and attachment-security costs. |
| SMS/email/push preference matrix | **Defer.** Keep mandatory in-app/Zalo notifications first. | The application already has a primary delivery channel; multi-channel preferences add provider and compliance complexity. |

### Recommended delivery order

1. Standardize the existing `HouseOwnership` acting-owner scope across all House APIs and add security tests; introduce a separate membership model only if limited non-owner members are required.
2. “My house,” correction requests, and minimal public neighborhood information.
3. Notification completion and the House action dashboard.
4. Extend `Request` into the House task lifecycle.
5. Complete complaint and support supplement/result/escalation flows.
6. Add incident shortcuts, House-aware surveys, and meeting publication features.
7. Build inspection campaigns only against a confirmed operational campaign.
8. Add unified history and advanced privacy/session/preferences features based on usage evidence.

## Important qualification

This is a source-code assessment, not an acceptance test against deployed data. A feature is not counted as fully available merely because similarly named code exists. Before using this report for sign-off, run end-to-end scenarios with at least a verified representative, a limited House member, a neighborhood officer, and a ward officer, including the eight mandatory IDOR/state-transition tests in the specification.
