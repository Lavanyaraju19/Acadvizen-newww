# Proposal: warn before the homepage is taken offline

**For:** the owner and the developer who would build and approve it.

**Status:** proposal only. It is a future enhancement, **not required for the handover**, and it is not built or installed. It would ship as plugin 0.7.11, tested locally first, and be installed only with the owner's approval.

## 1. Why

On 27 Oct 2026 the Enrollment homepage (https://enroll.acadvizen.com/) answered "not found" from 06:51 to 08:29 UTC. The cause was a normal administrator action. The page chosen under **Settings → Reading → Homepage** ("Demo", #11892) was set to Draft. WordPress then had no published front page. Nothing warned the person. See the ledger, "Enrollment homepage outage".

A second gap showed up a few seconds later. "Demo – Copy" was published over the page that had just been unpublished. The plugin applied the new revision to the unpublished page and later reported the check as **Failed (HTTP 404)**. The report was correct, but it came 23 minutes after the action.

## 2. Where a page is taken offline today (plugin 0.7.10)

| Path | Code | Today |
|---|---|---|
| Status set to Draft or Pending: Quick Edit, the WordPress editor, Elementor ("Save as draft") | `guard_post_data()` in `includes/approval.php`, logged as `unpublish` / `by_reviewer` | Allowed for reviewers (administrators); refused for others |
| Moved to the Trash | `guard_trash()`, logged as `remove_live` / `by_reviewer` | Same |
| A working copy published over its live page | `publish_approved()`: `archive_live()` + `apply_revision()` | Applies the revision even when the live page is no longer published |

None of these checks whether the page is the homepage (`page_on_front`) or the posts page (`page_for_posts`).

## 3. What to build

The warning must not silently block an authorised administrator: it asks for a confirmation, then lets them proceed.

1. **One helper,** `site_entry_role( int $post_id ): string`. It returns `'homepage'` or `'posts page'` when Settings → Reading uses the page, and `''` otherwise. It also says what visitors will see.
2. **Before the action (browser):**
   - On **Pages**, the homepage row's *Trash* link asks for confirmation.
   - In **Quick Edit**, choosing a status other than *Published* for that row shows a confirmation.
   - The page's edit screen and the Elementor editor show a notice: "This page is the website's homepage. If you unpublish or trash it, https://enroll.acadvizen.com/ shows 'not found' until another page is published and chosen under Settings → Reading."
3. **On the server (any path, including REST and other plugins):**
   - In `guard_post_data()` and `guard_trash()`, the action is still allowed for reviewers. It is logged as `unpublish_homepage`, and a notice "The homepage is not published" is shown on every admin screen. The notice links to Settings → Reading and to the page.
   - The notice disappears as soon as a published homepage is set again.
4. **Copy over an unpublished page:** `publish_approved()` refuses with a new code, `live_not_published`. The message reads: "The page this copy belongs to is not published. Publish that page, or publish this copy as a new page." Nothing is applied, and no false "Publishing" state is recorded.
5. **Switch:** `ACADVIZEN_CMS_FRONT_PAGE_GUARD` (default on). Setting it to `false` in `wp-config.php` turns the warnings and the refusal off without reinstalling.

No database change, no new table, and nothing on the Main Website.

## 4. Test plan

**PHP unit tests (`tests/php/run.php`):**
- `site_entry_role` for the homepage, the posts page, an ordinary page, and "latest posts" mode;
- the notice condition when the front page is published, draft, trashed or missing;
- `publish_approved` returns `live_not_published` when the live page is a draft or in the trash, and leaves the page and its archives unchanged.

**Local acceptance (Docker copy, new `tests/wordpress/homepage-guard-acceptance.mjs`):**
1. Quick Edit the homepage → Draft:
   - the confirmation appears;
   - **Cancel** leaves it published and `/` answering 200;
   - **OK** unpublishes it, logs `unpublish_homepage`, shows the admin notice, and `/` answers 404.
2. Republish the page: the notice goes away and `/` answers 200.
3. The Trash link on the homepage row asks for confirmation; the same cancel/confirm results as step 1.
4. Unpublishing it through the REST API (no browser confirmation possible): logged, and the notice is shown.
5. The safe order:
   - publish a new page;
   - choose it as the homepage;
   - unpublish the old page.
   No warning appears, because the old page is no longer the homepage.
6. A working copy published over an unpublished live page is refused with the message; nothing changes.
7. Regression: `direct-publish-acceptance`, `approval-acceptance`, `scheduling-acceptance` unchanged; PHP and JS unit suites pass.

**Production after install (read-only, plus one reversible check):**
- the guarded install checks of `tools/release/install-plugin.mjs`;
- the Enrollment and Main regression of 27 Oct;
- open the homepage's Quick Edit, choose Draft, confirm the dialog appears, and click **Cancel**: nothing is saved.

## 5. Compatibility

- **WordPress 7.1.x:** Quick Edit is `inline-edit-post.js`. The confirmation hooks its *Update* button for the homepage row only, and other rows are untouched. The Trash link uses the plugin's existing `data-confirm` pattern, already used on the Main lists.
- **Elementor 4.3 / Pro 4.3:** a notice in the editor panel only. The save itself is not intercepted in the browser; the server-side log and notice apply.
- **Rank Math, Astra, Header Footer Elementor:** not involved.
- **Main Website:** no change. Main does not use Enrollment's homepage setting.

## 6. Rollback

- Plugin: `node tools/release/install-plugin.mjs --session <session> --undo` reinstalls 0.7.10 (the release file keeps it as the rollback package).
- Without reinstalling: `define( 'ACADVIZEN_CMS_FRONT_PAGE_GUARD', false );` in `wp-config.php`.
- No data to undo: the feature writes only history entries.

## 7. Effort

About half a day to build and test locally, plus the guarded install. It needs the owner's approval before it goes on production.
