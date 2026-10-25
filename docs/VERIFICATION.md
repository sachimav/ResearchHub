# Correction and verification notes

Reviewed and corrected on 2026-10-25.

## Changes

- Central environment loading and required JWT secret; access/invitation token audiences are separate.
- Current database roles and active-account status are checked on authenticated requests.
- Supervisor registration requires a signed invitation bound to one university email.
- Startup no longer creates demo accounts. Reference and demo seeding use explicit commands.
- Role-profile registration failures trigger cleanup; incomplete registrations stay inactive.
- Supervisor student lists are scoped to assigned projects, and student counts are deduplicated.
- Proposal assignments must reference an existing supervisor, and submitted proposals require an assignment.
- Meeting requests must target the assigned supervisor. Meetings, availability, identifiers, request bodies, and links receive validation.
- Supervisors can create deadlines only for supervised batches and delete only their own deadlines in those batches.
- Project progress derives from milestones; supervisor confirmation is required for completion. Reopening work clears the completion date. Concurrent project saves return a conflict.
- Public documents require approval. Public responses exclude internal feedback, contact information, and student registration numbers.
- Showcase list pagination and stale-response protection are implemented. Browsing the showcase is anonymous; opening full research details requires frontend sign-in and returns users to the selected project after login. The public API continues to expose only approved public data.
- A shared frontend API client handles headers, network errors and expired sessions. Route guards respond to logout, including across browser tabs. Browser date inputs are serialized as ISO timestamps.
- Authentication forms follow route changes and continue into the appropriate portal after registration or login. Supervisor milestone dialogs refresh after edits.
- Query indexes are declared for project, notification, document, meeting, feedback and deadline lookups.

## Checks

The repository includes backend security regression tests, frontend request/session tests, service-route contract tests, a read-only database/reference check, real HTTP/MongoDB workflows in an isolated temporary database, and a Vite/API/database stack check. Run commands are documented in the root README.

The existing database was reachable. Initial reference checks found no missing user, student, supervisor, department, batch or document-project references. Application records were not migrated or changed during verification. A weak local JWT secret was replaced with a generated value in the ignored backend `.env`; existing sessions require a fresh sign-in.

## Limits and follow-up work

- Browser rendering and interactive accessibility have not been visually verified. Build checks and Vite module checks do not substitute for browser interaction tests.
- Dashboard components remain large. The shared API/session logic was extracted, but splitting every tab and modal is a separate maintenance refactor.
- Auth rate limiting is per process; multiple backend instances require shared rate-limit storage. Configure trusted reverse proxies before relying on forwarded client addresses.
- Most authenticated lists and dashboard payloads still return all matching records; the public showcase is paginated.
- Notifications and their related domain writes do not use a transactional outbox. A database failure during a notification write can occur after the primary change has saved.
- JWT sessions remain in browser local storage. HttpOnly cookie authentication would require a separate CSRF/session design.
- Student email verification, password reset, an administrator portal, owned managed file uploads, topic similarity, and industry opportunities remain feature work.
- Existing demo accounts and legacy deadline ownership were preserved. Review those records deliberately before production deployment.
