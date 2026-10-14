# Destination guide: Main, Enrollment or Both

Every page, blog and template in the central admin has a **Publish To** setting. This guide explains what each choice does, what is checked, and what happens when one website fails.

Labels: **LIVE** means verified on production; **LOCAL** means verified on the local copy only.

## The two ways content reaches the Main website

| | Structured editing (live today) | Elementor pages through the Render Bridge (prepared, not live) |
|---|---|---|
| Where you edit | Acadvizen Master Admin → **Main Website** screens (forms) | The **Elementor editor**, on a WordPress page with Publish To |
| Main's design | Main's own Next.js design; you edit the content | Exactly the design you build in Elementor |
| Approval | Not used (save and publish on the screen) | Required when `ACADVIZEN_CMS_APPROVAL` is on |
| Production state | **ON** since 12 Oct (Content API) | **OFF**: needs plugin 0.7.0, the two wp-config switches and the Main switch (`MAIN-MIGRATION-PLAN.md` §4) |
| Verified | LIVE (pages and blogs) and LOCAL (all screens) | LOCAL |

The rest of this guide is about **Publish To** on Elementor pages, blogs and templates.

## What each choice does

| Publish To | Enrollment (enroll.acadvizen.com) | Main (www.acadvizen.com) |
|---|---|---|
| **Enrollment** | The page is live at its WordPress address, as before | Not shown. A Main address of the same name keeps Main's own page |
| **Main** | **Not shown** to visitors (404); it exists only for Main | WordPress draws the page and Main serves it at its Main address. That address is the page's slug, or the **Main address** field |
| **Both** | Live at its WordPress address | Also served at its Main address |

**Main addresses that already exist** (about, contact, course landing pages and so on):
- **Main keeps its own page** unless **Replace an existing Main page** is ticked (administrators only).
- **The Main homepage** (`/`) is taken over only by the page marked **Main homepage**. With approval on, that takes effect when the page is published, not when the box is ticked.
- **Application addresses can never be replaced:** admin, login, register, api, dashboard and the others listed in `lib/wordpress/bridgeRouting.js`.

## The four choices

1. **Save Draft:** nothing changes on either website.
2. **Main:** www.acadvizen.com only.
3. **Enrollment:** enroll.acadvizen.com only.
4. **Both:** one coordinated publication to both, tracked separately.

**Both is not one atomic transaction across two websites.**
- Each website is published and verified on its own.
- Each shows **Pending → Publishing → Published (verified)** or **Failed**.
- The result is "verified" only when both are.
- A partial failure names the failed website, and **Check again** retries only that one.

**Rollback per website:**
- **Approvals → Restore** puts an earlier approved revision back on every website of the page.
- **Main only:** a reviewer can put an earlier Main version back with **Make live** in the page's Versions box, without touching Enrollment.

## Publishing with approval

1. **Submit.** Clicking **Publish** in Elementor or WordPress does not publish: it submits that exact revision for approval.
2. **Review.** A reviewer approves it in **Approvals** (`REVIEWER-GUIDE.md`).
3. **Publish.** **Publish approved revision** publishes to the websites chosen in Publish To at the moment of approval. Changing Publish To afterwards cancels the approval.
4. **Verify.** Each chosen website is checked for the revision's mark:

| Publish To | Reported as **Verified** only when |
|---|---|
| Enrollment | The Enrollment page answers 200 with this revision |
| Main | The Main address answers 200 with this revision |
| Both | **Both** do. If only one does, the result is **Partial failure** and names the failing website |

Verified LOCAL: Main only, Enrollment only, Both, Main failing during Both (partial failure, then a retry), rollback on Both (`approval-acceptance.mjs` A6–A10).

## When a website fails

| What happened | What visitors see | What to do | Tested (LOCAL) |
|---|---|---|---|
| Main cannot draw the page (WordPress error, timeout) during **Both** | Enrollment shows the new version; Main the previous one | **Partial failure** naming Main. Fix the cause, then **Check again** | A9 |
| Enrollment cannot show the new version during **Both** | Main shows the new version; Enrollment the previous one | **Partial failure** naming Enrollment. **Check again** | R1 |
| Both fail | Neither shows the new version | **Failed**, both named. **Check again** once both are back | R2 |
| Nothing verified after about 20 minutes | Previous versions remain | **Failed**. Check the History, then retry or roll back | R2 (final attempt) |
| The same publish is clicked twice, reloaded or replayed | One publication only | The repeat is refused ("It is not approved yet") | R3 |

- **A newer publication always wins.** A late check of an older one can never overwrite a newer result, and never marks it successful.
- **Main stopped completely:** tested for structured blog publishing (both-failure suite), not yet with the approval flow, where drawing failures are simulated.

**Taking a page off Main** (a reviewer sets it to Draft) works as follows:
- Main serves its own page at that address again within about 10 seconds (LOCAL, `migration-acceptance.mjs` M5).
- For up to 30 seconds Main's address list can still name the page. During that window, visitors are sent once to the same address and get Main's own page, never a "Page not found".

## Changing a destination later

| Change | What happens |
|---|---|
| Both → Enrollment | After approval, Main stops serving the page and shows its own page again, if one exists (otherwise 404) |
| Enrollment → Both | After approval, Main starts serving it at its Main address |
| Main → Enrollment | The page becomes public on Enrollment and leaves Main |

Each change is a new revision: it must be submitted and approved.

**Mostly untested.** Two changes are tested:
- **Both → Main:** the page left Enrollment and stayed on Main (bridge scenario C, approval off).
- **Published → Draft on Main:** under approval (M5). The other changes describe how the plugin is designed to behave (`FINAL-OPEN-ISSUES.md` O-23). Until they are tested, check both websites after such a change.

## Blogs

- **Blogs keep their own Publish To.** Main, Enrollment or Both, in the Main Website → Blogs screen or the Posts editor (plugin 0.7.0). This is LIVE for the structured connection.
- **Approval** covers blogs drawn by Elementor through the Render Bridge. Structured blog editing is not under approval in 0.7.0 (`FINAL-OPEN-ISSUES.md`).
