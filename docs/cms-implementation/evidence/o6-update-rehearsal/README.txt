O-6 WordPress / plugin UPDATE REHEARSAL — LOCAL ONLY (12 Oct 2026, 20:30-21:10 UTC). Not staging, not production.

Environment: throwaway Docker WordPress on http://localhost:8090 built to production's versions:
WordPress 7.0.7, PHP 8.3, MariaDB 11, Astra, PHP memory 1536M (as production), site time zone UTC,
and production's plugins at their exact production versions and activation states (read from production
read-only on 12 Oct), plus Acadvizen Master Admin 0.6.1 from package dd6fcf27...e32c.
NOT included (not downloadable from wordpress.org): Elementor Pro 4.3.0 (premium), Hostinger Tools,
Hostinger Easy Onboarding, Acadvizen Course Enquiries (custom, production only). Content is synthetic
(an Elementor page with 6 widgets, a Contact Form 7 page, a post); production content was not available
(no Enrollment backup on this PC).

Groups applied, with a check after each (result-*.json):
  g1  WordPress core 7.0.7 -> 7.1.3
  g2  Elementor 4.3.3->4.3.4, ElementsKit Lite 4.0.7->4.0.8, GutenKit 2.5.1->2.5.3, PopupKit 2.3.6->2.3.7, ShopEngine 4.9.6->4.9.7
  g3  Rank Math 1.0.279->1.0.280, Yoast 28.5->28.6 (inactive), WPCode Lite 2.3.9->2.4.0, GTM4WP 2.0.5->2.0.6 (inactive), Hostinger Reach 1.8.4->1.8.6
Each check: 4 public pages + 7 admin screens (incl. the Elementor editor and the Master Admin screens) answer 200
without a critical error; rendered-content fingerprint (server HTML text) and Elementor widget list; REST root,
unsigned plugin manifest (401), public blogs route; plugin Settings -> Test connection to a local Main; PHP
fatal/warning/deprecated lines written to debug.log during the check.

Results: every group 0 problems, 0 PHP fatal/warning/deprecated, content fingerprints identical to the
baseline, Test connection "Connected" each time.
After all updates: page workflow 17/17 (pages-workflow-after-updates.txt; first attempt interrupted by a
Chromium network-suspend error, second showed P4 preview blocked because the local Main only allowed framing
from :8088 - correct security behaviour; Main rebuilt to allow :8090, then 17/17), blog targets 16/16.
Rollback rehearsal: core back to 7.0.7, the 10 plugins back to their old versions (--force), database restored
from the pre-update export -> result-after-rollback.json identical to result-before.json (content and plugin
versions), 0 PHP errors, Connected.
