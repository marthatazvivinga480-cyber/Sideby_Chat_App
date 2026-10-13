# Sideby ✳ — Firebase edition

An original, warm direct messaging app built with **Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore and optional Cloud Storage**. Cream, peach and coral give a compact, focused chat interface its own identity.

## Start with the demo

Requires Node.js 20.9+ and npm; Node 24 is used for verification.

```sh
npm install
npm run dev
```

Open http://localhost:3000/demo. Sample people do not reply. Message/conversation CRUD and profile changes are saved locally under `sideby-demo` in browser storage. Demo files display filenames only. No Firebase configuration is needed for this route.

## Connect the real app

Follow **[docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)**. It walks through:

1. Creating a Firebase project and registering a Web app.
2. Enabling email/password Auth and authorizing localhost.
3. Creating `(default)` Firestore and publishing the included rules.
4. Configuring public values and private server credentials in `.env.local`.
5. Registering two verified accounts and testing live chat.
6. Optionally enabling Storage on the Blaze plan.

This edition replaces Supabase entirely. There is no SQL/RLS migration to run. Installing Firebase into the older Supabase edition does not convert it; use this edition's source and package file.

## Features

| Area          | Included behavior                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Auth          | Signup, verification email, verified-email login, HttpOnly server session, sign out                   |
| Profiles      | Validated onboarding, atomic unique usernames, display name/bio editing                               |
| Conversations | Username-prefix search, deduplicated direct conversations, bilateral deletion                         |
| Messages      | Create/read/edit/delete, server timestamps, ownership checks, live snapshots                          |
| Read state    | Unread counts, per-member read timestamps, peer read indicators                                       |
| Activity      | Room-scoped approximate presence and expiring typing status                                           |
| Files         | Optional private uploads, 5 MB/MIME checks, authorized short-lived downloads                          |
| UX            | Responsive thread/inbox, empty/loading/error states, draft retention on failure, modal focus handling |
| Demo          | Explicit Demo mode label, browser-local state, no fabricated remote responses                         |

## Architecture

```
src/app/                    Pages, protected server views and fallbacks
src/app/api/session/        Session creation and logout
src/app/api/[resource]/     Validated profile/chat/read/activity mutations
src/app/api/attachment/     Authorized signed download redirects
src/lib/firebase/           Client/Admin setup, session, live data and authorization helpers
src/components/             Auth, profile and chat views
firestore.rules             Verified-user/member reads; client writes denied
storage.rules               Private member reads; constrained own uploads
firebase.json               Rule deployment and optional emulator configuration
tests/                      Input and authorization boundary tests
```

Firebase Web Auth supports browser Firestore/Storage access. The server exchanges a recently issued, verified ID token for a five-day Firebase session cookie. The cookie is HttpOnly, SameSite=Lax, and Secure in production. Session creation and mutations require an exact same-origin header. Server pages and all mutations verify the cookie with revocation checks. The Proxy cookie check is only an early redirect and is never the authorization boundary.

Firestore clients can read only authorized data; writes go through the Next.js API. Firebase Admin bypasses security rules, so each mutation independently enforces session identity, membership, ownership and validation. Username reservations are transactional. Direct room IDs hash a sorted, unambiguous pair of user IDs. Sending is transactional with a persisted ten-messages-per-ten-seconds guard. Editing accepts only body text; author, room, attachments and creation time cannot be changed by that endpoint.

Firestore `onSnapshot` listeners update room membership/read state and messages. Presence writes every 20 seconds while visible and expires after 60 seconds; typing writes are throttled and expire after three seconds. This adds Firestore reads/writes and is approximate, room-scoped presence. Opening several tabs can briefly make presence inconsistent. Read state is updated only for a visible conversation and a visible browser tab, and means the thread was open, not proof of individual comprehension.

Conversation deletion first locks the room, attempts file cleanup when enabled, then recursively deletes its Firestore documents. Concurrent deletion requests are rejected to prevent a second cleanup from deleting a recreated room. File cleanup failures are reported and may require an administrator retry. If recursive deletion fails, the room stays locked until an administrator completes cleanup. Message deletion also attempts file cleanup. Unsent uploads can become orphans if a tab closes between upload and send; add a scheduled cleanup before production use.

## Checks

```sh
npm run typecheck
npm test
npm run format:check
npm run build
```

See `docs/VERIFICATION.md` for the actual verification record and `docs/ACCEPTANCE.md` for the remote two-user/security checklist. No Firebase project or credentials are bundled.

## Deployment and remaining work

Use a Node-compatible Next.js host, configure the public and server environment values, and add its domain to Firebase Auth. Restart/rebuild after public environment changes. Use HTTPS in production. Do not cache signed-in responses on a shared CDN. Firebase Hosting static deployment alone will not execute this app's Node API routes.

This is an initial implementation, not an audited production service. Follow-up work includes message cursor pagination (currently all accessible messages are listened to), scoped preview queries, Firebase App Check and endpoint abuse controls, recovery/account deletion flows, content scanning, orphan cleanup, observability, and automated emulator tests for routes and deployed rules. Boundary tests do not replace those integration checks.

Storage is disabled by default because Firebase Storage requires a billing-backed Blaze plan. Text chat can be configured first. Monitor Firestore operation usage; live listeners, presence and read receipts consume operations.

## Design

Palette: `#FAF2E9`, `#FAD8B8`, `#F2745B`, `#080808`, `#FFFFFF`, `#D8D0C8`. Restrained system typography, consistent icon sizing, initials avatars, modest headings and aligned surfaces keep the experience self-contained.

The original Supabase chat reference informed feature scope only. This source, UI and Firebase architecture are original. Project source uses the included MIT license; dependencies retain their own licenses.

References: [Firebase Web setup](https://firebase.google.com/docs/web/setup), [Session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [Firestore listeners](https://firebase.google.com/docs/firestore/query-data/listen), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started).
