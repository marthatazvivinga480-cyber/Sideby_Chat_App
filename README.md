# Sideby - Realtime Chat

An original, warm direct messaging app built with **Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore and optional Cloud Storage**. Cream, peach and coral give a compact, focused chat interface its own identity.

## Start with the demo

Requires Node.js 20.9+ and npm; Node 24 is used for verification.

```sh
npm install
npm run dev
```

Open http://localhost:3000/demo. Sample people do not reply. Message/conversation CRUD and profile changes are saved locally under `sideby-demo` in browser storage. Selected images have previews before sending and inside message bubbles. Demo image previews last until refresh; filenames and messages remain in browser storage. Other attachments display filenames. No Firebase configuration is needed for this route.

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
| Auth          | Signup, email verification, sign-in, show/hide password, password-reset email, HttpOnly session, sign out                   |
| Profiles      | Validated onboarding, lowercase unique usernames, optional bio, display name/bio editing                               |
| Conversations | Username-prefix search, deduplicated direct conversations, bilateral deletion                         |
| Messages      | Create/read/edit/delete, searchable emoji picker, server timestamps, ownership checks, live snapshots                          |
| Read state    | Unread counts, per-member read timestamps, peer read indicators                                       |
| Activity      | Room-scoped approximate presence and expiring typing status                                           |
| Files         | Image previews, optional private uploads, 5 MB/MIME checks, authorized short-lived downloads                          |
| UX            | Responsive thread/inbox, empty/loading/error states, draft retention on failure, modal focus handling |
| Demo          | Explicit Demo mode label, browser-local state, no fabricated remote responses                         |

| Reactions     | Six emoji choices, one reaction per user per message, click again to remove, live updates |
| Replies       | Quoted original-message preview, cancel reply, server-validated reply target |

## Verified locally

Two verified accounts were tested in separate browser windows. Username search, direct conversation creation, messages in both directions, editing and deleting were confirmed by the project owner. Refreshing both windows preserved messages and edits, and deleted messages stayed deleted.

Password recovery was tested by the project owner: a reset email was received and sign-in with the new password succeeded. Reactions appeared in both accounts, reaction removal was observed, and quoted replies persisted after refresh. The local production build completed successfully. Real file uploads and downloads have not been tested with Storage enabled.

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

See `docs/VERIFICATION.md` for the actual verification record and `docs/ACCEPTANCE.md` for the remote two-user/security checklist. Private credentials and local environment files are excluded from Git; `.env.example` contains placeholders only.

## Deploy on Render

Create a Node Web Service from this repository with branch `main` and an empty root directory.

- Build command: `npm ci && npm run build`
- Start command: `npm start -- --hostname 0.0.0.0`
- Add the six `NEXT_PUBLIC_FIREBASE_` web configuration values from `.env.example`.
- Keep `NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE=false` while image sharing is disabled.
- Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` privately in Render. Preserve escaped `\n` in the private key. Never commit the service-account JSON.
- Do not use the local Windows `GOOGLE_APPLICATION_CREDENTIALS` path on Render.
- Add the deployed hostname to Firebase Authentication's authorized domains.

Render's `RENDER_EXTERNAL_URL` is used for origin validation because its HTTPS proxy can forward requests with an internal server address. Local development falls back to the request URL. Missing and foreign origins are rejected.

The initial Render deployment succeeded. A sign-in origin mismatch was subsequently fixed locally; successful live sign-in after redeployment still needs confirmation.

## Remaining work

Use a Node-compatible Next.js host, configure the public and server environment values, and add its domain to Firebase Auth. Restart/rebuild after public environment changes. Use HTTPS in production. Do not cache signed-in responses on a shared CDN. Firebase Hosting static deployment alone will not execute this app's Node API routes.

This is an initial implementation, not an audited production service. Follow-up work includes message cursor pagination (currently all accessible messages are listened to), scoped preview queries, Firebase App Check and endpoint abuse controls, account deletion flows, content scanning, orphan cleanup, observability, and automated emulator tests for routes and deployed rules. Boundary tests do not replace those integration checks.

Storage is disabled by default because Firebase Storage requires a billing-backed Blaze plan. Text chat can be configured first. Monitor Firestore operation usage; live listeners, presence and read receipts consume operations.

## Design

Palette: `#FAF2E9`, `#FAD8B8`, `#F2745B`, `#080808`, `#FFFFFF`, `#D8D0C8`. Restrained system typography, consistent icon sizing, initials avatars, modest headings and aligned surfaces keep the experience self-contained.

The original Supabase chat reference informed feature scope only. This source, UI and Firebase architecture are original. Project source uses the included MIT license; dependencies retain their own licenses.

References: [Firebase Web setup](https://firebase.google.com/docs/web/setup), [Session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [Firestore listeners](https://firebase.google.com/docs/firestore/query-data/listen), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started).
