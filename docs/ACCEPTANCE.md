# Firebase acceptance checks

Run against a disposable Firebase project with two verified users A/B, an unrelated verified user C, and one unverified account. These checks are not claimed as already passed against a live project.

1. Visit `/chat` signed out or with a forged cookie: expect login redirect. Direct API calls without a valid session must return 401. Cross-origin mutation/session requests must return 403.
2. Sign up, verify email, sign in and onboard A/B. An unverified user cannot create a session or read Firestore/Storage data. Register duplicate usernames concurrently: only one succeeds.
3. Search by username prefix, start A/B's direct conversation concurrently: one room, two members. C cannot list or read that room or its messages/activity.
4. Send/reply across two browser sessions: observe live snapshots, unread counts and peer read status. Hide a tab or return to the mobile inbox: messages remain unread until its thread is visible.
5. Edit/delete A's message. B sees the update. Attempt changing B's message through A's API: reject. Attempt supplying another sender UID on create: reject.
6. Write profiles, messages, membership, usernames or rate windows directly from the Firebase client SDK: reject. Only authorized server endpoints mutate Firestore. Forged member arrays must not bypass API checks.
7. Send eleven distinct messages within ten seconds: rate limit the eleventh. Retry a message ID already committed: do not create a second document.
8. Type, switch threads, close tabs, restore tabs: typing expires and presence becomes offline within 60 seconds after missed heartbeats. Presence is approximate and room-scoped.
9. With Storage disabled, selecting an attachment gives a setup message while text chat works. With Storage enabled, accept an allowed file under 5 MB; reject HTML, oversized data, overwrites, another user's upload path and C's reads.
10. Download as B through the app and verify a one-minute signed URL. C's server download endpoint request must be rejected. Delete the room and confirm old client reads are blocked, messages/activity removed and Storage objects cleaned up or a cleanup warning reported.
11. Disconnect and send: preserve the draft and show errors. Restore, retry and verify behavior. Test session expiry and sign out, then revisit protected routes.
12. Check desktop/phone layout, keyboard navigation, modal focus, long messages, empty search, profile errors and explicit demo labels. Verify the demo remains separate from the real database.

Before public launch, add automated Firestore/Storage emulator authorization tests and API/session integration tests. Admin writes bypass rules; both boundaries need testing.
