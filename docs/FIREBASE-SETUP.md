# Connect Sideby to Firebase

You do not need Supabase for this version. The previous project's `.env.local` values and SQL migration do not apply.

## 1. Create the Firebase project

Open https://console.firebase.google.com/ and create a project called **sideby** (or another name). Analytics is optional and unused by this app. Register a **Web app** using the `</>` icon. Hosting setup is not required for local development.

## 2. Enable accounts

Open **Authentication → Sign-in method**, enable **Email/Password**, and save. Under Authentication settings, add `localhost` to **Authorized domains** if it is absent. Also add your deployed app domain when publishing.

Accounts must verify their email before chat access. Firebase sends a verification email on signup. Click the link, then return to `/login` and sign in. An unverified login sends another verification email, subject to Firebase Auth's limits.

## 3. Create Firestore

Open **Firestore Database**, create a **Standard / Native mode** database with ID `(default)`, choose a region near your intended users, and start with **production rules**. Use the region carefully: changing it later requires migration.

Open Firestore's **Rules** tab, replace its content with the entire `firestore.rules` file from this project, and publish. Do not leave test-mode rules enabled. The app creates its collections automatically after signup/profile setup; there is no SQL migration.

## 4. Configure the Web app

In VS Code, copy `.env.example` to `.env.local` beside `package.json`. From **Project settings → General → Your apps → Web app configuration**, fill in:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE=false
```

Copy the actual config values; do not guess the bucket name. Public Web app config identifies the project. Access is controlled by auth, rules and server checks.

## 5. Configure the server

The Next.js server uses Firebase Admin for verified sessions and validated mutations. Open **Project settings → Service accounts → Firebase Admin SDK** and generate/download the service-account JSON. This is a private credential. Keep it outside your repository, never upload it to Git, and never paste its contents into chat or screenshots.

The simplest local setup is to set an absolute path to that private JSON in `.env.local`, using forward slashes:

```env
GOOGLE_APPLICATION_CREDENTIALS="C:/Users/IT Admin/secure/firebase-admin.json"
```

Use the real location where you saved the JSON. Alternatively, set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from its `client_email` and `private_key` fields. Quote the private key and preserve escaped `\n`. These two fields must never have a `NEXT_PUBLIC_` prefix.

On a Google-hosted runtime with a configured service account, you can set `FIREBASE_USE_APPLICATION_DEFAULT=true` and use that identity. Your Node host must have permissions for Firebase Auth, Firestore and, if enabled, Storage.

## 6. Run and test

```sh
npm install
npm run dev
```

Open http://localhost:3000/signup, register, verify the email, sign in, and complete onboarding. Use a second browser profile or private window for a second account. Search the peer's **username prefix**, create a conversation, send, edit and delete messages. Text chat works with Storage disabled.

If a server is already running, stop it with Ctrl+C before starting this version. Restart after changing environment values. The public `/demo` route remains browser-local and is explicitly marked **Demo mode**; `/chat` uses your Firebase project.

## 7. Optional attachments

Cloud Storage for Firebase requires the **Blaze plan and a billing account**. You can leave attachments disabled and complete text chat setup first. If you choose to enable it:

1. Enable Cloud Storage and copy the actual bucket name to `.env.local`.
2. Publish the project's `storage.rules` in Storage's Rules tab. These rules consult Firestore for membership; accept the Firebase prompt to grant the Storage rules service permission to read Firestore.
3. Set `NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE=true` and restart.
4. Test a PNG/PDF upload under 5 MB, a peer download, and rejection from an unrelated account.

The app does not upgrade your billing plan or deploy rules for you. Storage uploads use the Firebase client SDK; download requests verify the server session and redirect to a signed URL valid for one minute. The app avoids persistent public download-token links.

## Optional rule deployment from the CLI

If you already use the Firebase CLI, select the intended project explicitly:

```sh
firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

Only deploy Storage rules after enabling Storage:

```sh
firebase deploy --only storage --project YOUR_PROJECT_ID
```

## Troubleshooting

- **Firebase setup needed:** check the four required public values (API key, auth domain, project ID and app ID), then restart.
- **Admin configuration:** check the JSON path or server email/private key. The service account must belong to the same project as the Web app.
- **Permission denied:** publish the supplied rules, verify the email, sign in again, and confirm `(default)` Firestore is in Native mode.
- **Unauthorized domain:** add `localhost` or your hosting domain to Firebase Auth's authorized domains.
- **Files cannot upload:** enable Storage, publish its rules and verify the billing plan and bucket name.
- **Session expired:** sign out and sign in again. Server sessions last five days; browser SDK sign-in alone does not create a new server session.
- **Port 3000 occupied:** stop your previous Sideby terminal server. Follow the port printed by Next.js if it starts on another port.

Official docs: [Web setup](https://firebase.google.com/docs/web/setup), [Email/password auth](https://firebase.google.com/docs/auth/web/password-auth), [Admin setup](https://firebase.google.com/docs/admin/setup), [Session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started), [Storage billing](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
