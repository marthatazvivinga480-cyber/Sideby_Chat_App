# Verification record

## Automated checks

- TypeScript checks passed in the Desktop project after the latest UI, emoji picker, image preview, profile form and password-reset changes.
- The original 13 validation, authorization and request-boundary tests passed during Firebase setup. A later readable-error test was added, but its run was blocked by a Windows Node memory error; the full updated suite has not been confirmed.
- Dependencies are installed and `package-lock.json` is included.
- The project owner ran `npm run build` successfully: Webpack compilation, TypeScript, static generation and build traces completed. This supersedes the earlier Windows EPERM build failure.
- Formatting was checked earlier; it has not been verified across all subsequent changes.

## Manual verification reported by the project owner

- Firebase Email/Password sign-up, email verification, sign-in and profile setup succeeded for two accounts.
- Username search found the other account and a direct conversation was created.
- Messages arrived in both directions in separate browser windows.
- Message editing and deletion worked.
- Refreshing both windows preserved messages and edits; deleted messages remained deleted.

## UI review

The landing page was visually checked at desktop and phone widths. Authentication, onboarding and real chat were reviewed through user screenshots. Emoji picker, password visibility and image preview interactions still need a complete browser regression check.

## Additional feature checks

- Reactions appeared in both accounts and removal was observed.
- Quoted replies and their editing were reviewed in screenshots; reply persistence after refresh was confirmed by the project owner.
- TypeScript and seven targeted origin-validation checks passed after the Render origin fix.
- Render initially reported deployment succeeded; live sign-in after the origin fix still needs confirmation.

## Remaining verification

- Password reset email delivery and subsequent sign-in with the new password were confirmed by the project owner.
- Real Firebase Storage uploads, private downloads and image rendering.
- Negative permission cases and deployed rules against unrelated users.
- Full updated test suite and formatting check.
- Live sign-in and two-account messaging after redeploying the Render origin fix.

Private service-account credentials and `.env.local` are not part of the repository. See ACCEPTANCE.md for the broader integration checklist.
