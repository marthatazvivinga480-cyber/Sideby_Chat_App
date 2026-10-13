# Verification record

## Automated checks

- TypeScript checks passed in the Desktop project after the latest UI, emoji picker, image preview, profile form and password-reset changes.
- The original 13 validation, authorization and request-boundary tests passed during Firebase setup. A later readable-error test was added, but its run was blocked by a Windows Node memory error; the full updated suite has not been confirmed.
- Dependencies are installed and `package-lock.json` is included.
- The Webpack production build compiled application code and completed TypeScript checks, then failed during prerender file creation with a Windows EPERM error. A complete production build remains unverified.
- Formatting was checked earlier; it has not been verified across all subsequent changes.

## Manual verification reported by the project owner

- Firebase Email/Password sign-up, email verification, sign-in and profile setup succeeded for two accounts.
- Username search found the other account and a direct conversation was created.
- Messages arrived in both directions in separate browser windows.
- Message editing and deletion worked.
- Refreshing both windows preserved messages and edits; deleted messages remained deleted.

## UI review

The landing page was visually checked at desktop and phone widths. Authentication, onboarding and real chat were reviewed through user screenshots. Emoji picker, password visibility and image preview interactions still need a complete browser regression check.

## Remaining verification

- Password-reset email delivery and completion.
- Real Firebase Storage uploads, private downloads and image rendering.
- Negative permission cases and deployed rules against unrelated users.
- Full updated test suite, formatting check and successful production build.

Private service-account credentials and `.env.local` are not part of the repository. See ACCEPTANCE.md for the broader integration checklist.
