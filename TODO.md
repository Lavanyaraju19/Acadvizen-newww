# E2E Admin Auth Fix — Task Progress

## Root cause (confirmed)
The E2E runner (`e2e/utils.js`, `playwright.config.js`) loads env files in order
`['.env.test.local', '.env.local', '.env']` with `override:false`, so
`.env.test.local` (local disposable Supabase `127.0.0.1:54321`, email len 19 /
pass len 11) wins over `.env.local` (staging Supabase
`hhfccftkfryesjirauwf.supabase.co`, email len 23 / pass len 19).

The Next.js server on port 3200 runs with `.env.local` (staging). The browser
submits the `.env.test.local` credentials to the staging `/api/admin/login`,
which returns `Invalid email or password.`.

Verified:
- `.env.local` staging creds login OK against `https://hhfccftkfryesjirauwf.supabase.co` (status 200).
- `.env.test.local` creds OK only against local `127.0.0.1:54321`.
- No server/credential mismatch after precedence fix.

## Steps
- [x] Diagnose root cause
- [x] Delete temporary debug/credential scripts
- [x] Fix env loading precedence: `.env.local` first in `e2e/utils.js` + `playwright.config.js`
- [x] Run focused auth suite — run #1: PASSED (6/6, `test-results/.last-run.json` status=passed)
- [x] Run focused auth suite — run #2: PASSED (6/6, `test-results/.last-run.json` status=passed)
- [x] Run focused auth suite — run #3: PASSED (6/6, `test-results/.last-run.json` status=passed, "6 passed (19.9s)")
- [x] Three consecutive focused auth-suite runs achieved
- [ ] Continue CMS workflow (pages publish-to-live, etc.)
- [ ] Full E2E suite x2
- [ ] Final security + git report

## Test command
`npm run test:e2e -- --project=chromium e2e/admin-auth.spec.js --workers=1`

