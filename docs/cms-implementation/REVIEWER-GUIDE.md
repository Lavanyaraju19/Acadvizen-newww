# Reviewer guide: approving what goes live

For the people who decide what is published on www.acadvizen.com and enroll.acadvizen.com.

Applies to plugin 0.7.0 with approval turned on (`ACADVIZEN_CMS_APPROVAL`). **Tested LOCAL only; not installed on production yet.**

## Who is a reviewer

| Account | Can approve | Can accept typed code (HTML, shortcodes) |
|---|---|---|
| Administrator | Yes | Yes |
| **Reviewer (approves publishing)** (role created by the plugin) | Yes | Only if also given "unfiltered HTML" (administrators have it) |
| Editor, Author, Contributor | **No**: they prepare and submit | No |

- **Self-approval is allowed but recorded.** The history marks it "approved by the person who submitted it". For important pages, ask a second person.
- **Global styles are reviewer-only.** The Elementor kit (Site Settings: colours, fonts, buttons) changes both websites at once, so only a reviewer can save it. Each save is recorded in the history.
- **Main navigation is reviewer-only.** A menu shown on the Main website changes every Main page at once. Only a reviewer can save it: in Appearance → Menus, through the REST menu routes, and (for non-reviewers) not at all in the Customizer. Each save is recorded. Menus used only on Enrollment keep their usual workflow.
- **Putting an earlier version back on Main** ("Make live" in a page's Versions box) is reviewer-only and recorded.

## Where to review

**WordPress admin → Acadvizen Master Admin → Approvals.**

| Section | What it shows |
|---|---|
| **Waiting for approval** | Every submitted revision: content, websites (Main / Enrollment / Both), compatibility, previews, decision |
| **Approved, ready to publish** | Approved revisions not published yet, with **Publish approved revision** |
| **Recent publications** | Per website: Verified, Checking or Failed, with **Check again** and **Restore** for earlier revisions |
| **History** | Every submit, approval, rejection, edit after approval, publication, verification, rollback and global-styles save: when, who, what, result, revision |

"Changes to a live page" means a working copy of a page visitors already see. "New" means a page that is not live yet.

## How to review one revision

1. **Open the previews.**
   - **Enrollment design** shows the page as Enrollment will show it.
   - **As on the Main website** shows it inside Main's header and footer.
   - **Desktop / tablet / phone** shows all three widths side by side.
2. **Check the compatibility column.**

   | Result | Meaning | What you do |
   |---|---|---|
   | ok | Draws and works on the chosen websites | Nothing extra |
   | review | Draws, but something needs a human look (an add-on's interactive parts, search or post lists on Main, custom CSS, animations, dynamic content) | Try it in the preview |
   | code | Contains typed HTML or a shortcode | Read the code, then tick **I checked the code**; approval is refused without it |
   | blocked | Cannot be reproduced on a chosen website (widget not installed, shop or login on Main) | Cannot be approved. The message says which widget, which website, why, and the fix |
3. **Decide.**
   - **Tick "I checked the … preview"** for every chosen website (for **Both**: Main and Enrollment). Approval is refused until each is ticked.
   - **Approve this revision** approves exactly what you previewed. The approval records the websites, the previews you confirmed, you, and the time.
   - **Reject** asks "What should change?" and sends it back to the editor as a draft with your note.

**An approval belongs to one exact revision.** These are all part of it:
- text and design;
- image files;
- Publish To and the address;
- **SEO fields** (title, description, canonical, robots, social and schema fields);
- the global styles.

If anyone changes any of them afterwards, the approval is cancelled automatically and the page must be submitted again. Publishing also re-checks the revision, and refuses if it changed. Saving without a change keeps the approval.

**Status of each website after publishing:** **Pending** (not published yet), **Publishing** (published, being checked), **Published (verified)**, **Failed**.

## Publishing and verification

1. Click **Publish approved revision**. A reviewer, or an editor allowed to publish, can do this. It is refused if anything changed since approval.
2. The plugin:
   - keeps the previous live version as an **archive**;
   - puts the approved revision live;
   - draws it for the Main website if Main is chosen.
3. Within a few minutes it **checks each chosen website**. A website counts as **Verified** only when its public page answers 200 and carries this revision's mark.
4. **Results:**

   | Result | Meaning |
   |---|---|
   | **Verified** | Every chosen website shows the approved revision |
   | **Partial failure** | One website shows it and the other does not, for example Main was unreachable. The failing website keeps its previous version. Fix the cause, then **Check again** (it also retries drawing) |
   | **Failed** | No chosen website shows it after about 20 minutes of checks |

   Success is never reported unless every chosen website was verified.

**Shared parts (header, footer, cards, the tool or blog design): checked on one page, then redrawn everywhere.**
- A shared part is verified on one page that shows it. For a card, that is a page whose list draws it, for example the tool card on a tool page.
- Every other Main page that uses it is then redrawn automatically, one after another. In the 14 October rehearsal that was 50 pages in about a minute, with no failures. Until a page is redrawn it still shows the previous version, and Main may keep a drawn page for up to 5 minutes.
- So after publishing a new header or footer, allow about 5–10 minutes before checking other pages. If one page still shows the old version after that, open **Acadvizen Master Admin → Publishing**: every redraw is listed with its result.

## Scheduled publishing

If the editor set a **publish date in the future** before submitting, the date is part of what you approve.

1. **The button reads differently:** **Schedule approved revision for <date and time>**, in the site's time zone. Clicking it schedules the publication; nothing goes live yet.
2. **Approvals shows "Scheduled for …"** with **Cancel schedule**.
3. **When the time comes,** the plugin re-checks the revision:
   - if it is still exactly what you approved, it is published and verified like any publication;
   - if anything changed, it is **not** published, and the page goes back to Draft for a new approval.
4. **Cancel schedule** keeps the approval. You can then publish now, or schedule again.
5. **A scheduled revision cannot be published early by hand.** Cancel the schedule first.

The scheduled job runs through WP-Cron, so on a quiet site it runs at the first visit after its time. Hostinger's server cron calling `wp-cron.php` every minute keeps it on time (`FINAL-MAINTENANCE-GUIDE.md`). Tested LOCAL: `approval-reliability-acceptance.mjs` R4.

## When something fails, and what "Check again" does

| Situation | What Approvals shows | Tested (LOCAL) |
|---|---|---|
| Main fails, Enrollment works | **Partial failure**, Main named | A9 |
| Enrollment fails, Main works | **Partial failure**, Enrollment named | R1 |
| Both fail | **Failed**, both named; Main shows nothing new | R2 |
| Main unreachable altogether | Main reported failed; Enrollment unaffected | Under approval: not with Main actually stopped; drawing failures are simulated (A9, R2). Structured blog publishing was tested with Main stopped (both-failure suite) |

**Check again** retries only the websites that failed: it redraws the page for Main, and checks restart. It does nothing once everything is verified.

- **A publish click repeated or replayed** (double click, reload, an old link) is refused with "It is not approved yet". Nothing is published twice, and no extra archive is made (R3).
- **A forged or reused approve link** from another user is refused (R3).

## Rolling back

**Recent publications → Restore** puts an earlier approved revision back live on its websites. It is verified like a publication, and only reviewers can do it. The 10 most recent revisions are kept per page.

For a whole-site problem, see `FINAL-RELEASE-AND-ROLLBACK.md`.

## What reviewers should not do

- Approve a revision you have not previewed on every chosen website.
- Tick **I checked the code** without reading it. Scripts in an HTML widget run for every visitor.
- Approve shop, cart or login widgets for Main. They are blocked for a reason: those features run on Enrollment only.
