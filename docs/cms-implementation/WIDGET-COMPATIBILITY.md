# Widget and integration compatibility

How the central admin decides whether an Elementor design can be published to the Main website, the Enrollment website or both, and the verified widget inventory.

Applies to plugin 0.7.0 (`includes/registry.php`). The inventory below is **LOCAL**: production's list needs a WordPress admin login (`FINAL-OPEN-ISSUES.md` O-25).

## Principle

- **Rendering is never re-implemented.** Enrollment pages are drawn by WordPress and Elementor. Main pages are drawn by the same WordPress and Elementor, then served by Main through the Render Bridge. Any installed, active widget therefore draws the same on both websites. Proven LOCAL by the desktop, tablet and phone layout check on both websites (`approval-acceptance.mjs` A8; screenshots in `evidence/approval/`).
- **What can differ is behaviour after the page loads.** Code in the visitor's browser that calls back into WordPress (forms, carts, logins, live search) only works on www.acadvizen.com for the addresses Main forwards to WordPress (`lib/wordpress/proxyPolicy.js`: forms, the enquiry endpoint, static assets).
- **Nothing is dropped silently.** A widget that cannot be reproduced blocks submission, approval and publishing, with a reason and a fix. It is never left out of the page.

## The four classes (per widget, per website)

| Class | Meaning | Effect |
|---|---|---|
| **ok** | Draws and works there | None |
| **review** | Draws, but something needs a human check: an unknown add-on's interactive parts on Main, WordPress search or post lists on Main, custom CSS or attributes, animations, dynamic content | Shown to the reviewer; approval allowed |
| **code** | Runs typed HTML or a shortcode | Approval only by a reviewer with "unfiltered HTML" who ticks **I checked the code** |
| **blocked** | Cannot be reproduced there: the widget's plugin is not installed or active, or a shop or login widget on Main | Submit, approve and publish are refused, with the reason and the fix |

**A page's result is the worst class over all its widgets and all its chosen websites.** The order is blocked, then code, then review, then ok.

## Rules

| Widget | Main | Enrollment | Why |
|---|---|---|---|
| HTML (`html`), Shortcode (`shortcode`), Custom HTML (`wp-widget-custom_html`) | code | code | Typed markup or code |
| Code Highlight | review | review | Shows code as text |
| Elementor Pro Form (`form`), MetForm (`mf-*`, `metform`) | ok | ok | Submissions are forwarded by Main to WordPress |
| Login (`login`) | **blocked** | ok | Signs visitors in to WordPress, not Main. Fix: link to the Enrollment login |
| WooCommerce (`woocommerce-*`, `wc-*`), ShopEngine (`shopengine-*`) | **blocked** | ok | Shop, cart and checkout run on Enrollment only. Fix: publish to Enrollment, or link to the shop |
| Search form, WordPress Search widget | review | ok | Searches WordPress, not Main |
| Sitemap, Posts, Archive Posts | review | ok | List WordPress content; on Main as it was at publishing time |
| Any other widget from Elementor, Elementor Pro, Header Footer Elementor, Essential Addons, ElementsKit Lite, Royal (WPR), Unlimited Elements, MetForm, Cool Timeline, Acadvizen | ok | ok | Known to draw without calling WordPress for basics |
| Any other widget from another add-on | review | ok | Check its interactive parts in the Main preview |
| A widget whose plugin is not active | **blocked** | **blocked** | Fix: activate the plugin, or remove the widget |

**Page features flagged for review:** dynamic content tags, custom CSS on an element, custom HTML attributes, motion effects, animations.

**Element settings only Elementor Pro draws:** custom CSS, custom attributes and motion effects. When Pro is not active, the report states it plainly: "custom CSS on an element: NOT SHOWN, Elementor Pro is not active (the page appears without these styles)". Nothing is dropped silently. Production has Pro 4.3.0, so these settings draw there. If its licence lapses or Pro is deactivated, every affected page is flagged in Approvals.

**Global styles** (Elementor kit: colours, fonts, buttons) change both websites at once. They are not classified per page, because only reviewers can save them.

## Adding support for a new widget or integration

- **Most new widgets need nothing.** An installed widget is classified automatically: ok if its add-on is known, otherwise review on Main.
- **A widget that needs a specific rule**, for example blocked on Main or code, is added in one place: `widget_rules()` in `includes/registry.php`, or a site plugin's `acv_cms_widget_rules` filter:

  ```php
  add_filter( 'acv_cms_widget_rules', function ( $rules ) {
      $rules['booking-calendar'] = array( 'main' => 'blocked', 'why' => 'books on WordPress only', 'fix' => 'publish to Enrollment' );
      return $rules;
  } );
  ```
- **An add-on known to draw safely** can be added to `KNOWN_PROVIDERS`.
- **A feature that must work on Main**, such as a new form plugin's submit address, also needs a rule in `lib/wordpress/proxyPolicy.js` on Main, with a unit test.

**Acadvizen Master Admin → Widget compatibility** lists every installed widget with its plugin, version and class per website. It is visible when the Render Bridge UI is on.

## Verified inventory (LOCAL, 13 October 2026)

Local WordPress: Elementor 4.3.3 (Elementor Pro not installed), Ultimate Addons for Elementor (Header Footer Elementor) 2.9.5, MetForm 4.3.2, Contact Form 7 6.1.7, Rank Math 1.0.279, Acadvizen Master Admin 0.7.0.

**189 widgets classified:**

| | Count |
|---|---|
| ok on both websites | 155 |
| code (both) | 3 |
| review on Main, ok on Enrollment | 4 |
| review on both | 1 |
| blocked on Main, ok on Enrollment | 26 |

Raw data: `evidence/approval/local-widget-inventory-20261013.json`.

**Exercised end to end** (`approval-acceptance.mjs`, LOCAL):
- built in the editor and published to Main, Enrollment and Both, with layout checked at three widths: Container (nested), Heading (typography, responsive size), Text Editor, Button (responsive alignment), Image (uploaded media);
- refused before approval: a missing widget, and HTML without the code check.

Bridge scenarios (`scenarios.mjs`, LOCAL) also covered:
- page-level colours and one/two-column layouts on Main;
- the Elementor global colour on both websites;
- city and area location pages;
- failed drawing and recovery.

**Form forwarding** (enquiry endpoint, CF7, MetForm, Elementor Pro forms) is covered by unit tests of the proxy policy (`tests/unit/wordpress-bridge-support.test.js`), not by a browser submission on Main (`FINAL-OPEN-ISSUES.md` O-24).

### Every installed widget

#### elementor 4.3.3: 149 widgets

**OK on both websites (115):** Accordion (`accordion`), Accordion (`nested-accordion`), Alert (`alert`), Animated Headline (`animated-headline`), Archive Title (`theme-archive-title`), Archives (`wp-widget-archives`), Audio (`wp-widget-media_audio`), Author Box (`author-box`), Basic Gallery (`image-gallery`), Block (`wp-widget-block`), Blockquote (`blockquote`), Breadcrumbs (`breadcrumbs`), Business Card (`link-in-bio-var-7`), Button (`button`), Button (`e-button`), Calendar (`wp-widget-calendar`), Call to Action (`call-to-action`), Carousel (`nested-carousel`), Categories (`wp-widget-categories`), Classic (`link-in-bio-var-2`), common (`common`), common-base (`common-base`), common-optimized (`common-optimized`), Component (`e-component`), Countdown (`countdown`), Counter (`counter`), Divider (`divider`), Divider (`e-divider`), Facebook Button (`facebook-button`), Facebook Comments (`facebook-comments`), Facebook Embed (`facebook-embed`), Facebook Page (`facebook-page`), Featured Image (`theme-post-featured-image`), Flip Box (`flip-box`), Floating Bar CTA (`floating-bars-var-1`), Form (`form`), Gallery (`gallery`), Gallery (`wp-widget-media_gallery`), Google Maps (`google_maps`), Heading (`e-heading`), Heading (`heading`), Hotspot (`hotspot`), Icon (`icon`), Icon Box (`icon-box`), Icon List (`icon-list`), Image (`e-image`), Image (`image`), Image (`wp-widget-media_image`), Image Box (`image-box`), Image Carousel (`image-carousel`), Inner Section (`inner-section`), Links (`link-in-bio-var-4`), Loop Carousel (`loop-carousel`), Loop Grid (`loop-grid`), Lottie (`lottie`), Media Carousel (`media-carousel`), Menu (`mega-menu`), Menu Anchor (`menu-anchor`), Meta (`wp-widget-meta`), Minimalist (`link-in-bio`), Nav Menu (`nav-menu`), Navigation Menu (`wp-widget-nav_menu`), Off-Canvas (`off-canvas`), Page Title (`theme-page-title`), Pages (`wp-widget-pages`), Paragraph (`e-paragraph`), PayPal Button (`paypal-button`), Portfolio (`portfolio`), Portfolio Bio (`link-in-bio-var-6`), Post Comments (`post-comments`), Post Excerpt (`theme-post-excerpt`), Post Info (`post-info`), Post Navigation (`post-navigation`), Post Title (`theme-post-title`), Price List (`price-list`), Price Table (`price-table`), Progress Bar (`progress`), Progress Tracker (`progress-tracker`), Rating (`rating`), Read More (`read-more`), Recent Comments (`wp-widget-recent-comments`), Recent Posts (`wp-widget-recent-posts`), Reviews (`reviews`), RSS (`wp-widget-rss`), Search (`search`), Services (`link-in-bio-var-5`), Share Buttons (`share-buttons`), Showcase (`link-in-bio-var-3`), Sidebar (`sidebar`), Single Chat (`contact-buttons`), Site Logo (`theme-site-logo`), Site Title (`theme-site-title`), Slides (`slides`), Social Icons (`social-icons`), SoundCloud (`audio`), Spacer (`spacer`), Star Rating (`star-rating`), Stripe Button (`stripe-button`), SVG (`e-svg`), Table of Contents (`table-of-contents`), Tabs (`nested-tabs`), Tabs (`tabs`), Tag Cloud (`wp-widget-tag_cloud`), Template (`template`), Testimonial (`testimonial`), Testimonial Carousel (`testimonial-carousel`), Text (`wp-widget-text`), Text Editor (`text-editor`), Text Path (`text-path`), Toggle (`toggle`), Video (`e-self-hosted-video`), Video (`video`), Video (`wp-widget-media_video`), Video Playlist (`video-playlist`), YouTube (`e-youtube`)

| Widget | Main | Enrollment | Why |
|---|---|---|---|
| Shortcode (`shortcode`) | code | code | runs a WordPress shortcode |
| HTML (`html`) | code | code | HTML typed into the page (can contain scripts) |
| Search (`wp-widget-search`) | review | ok | searches the WordPress website, not the Main Website |
| Custom HTML (`wp-widget-custom_html`) | code | code | HTML typed into a WordPress widget |
| Posts (`posts`) | review | ok | lists WordPress posts; on Main it shows them as they were at publishing time |
| Code Highlight (`code-highlight`) | review | review | shows code as text |
| Login (`login`) | blocked | ok | signs visitors in to WordPress, which is not the Main Website |
| Archive Posts (`archive-posts`) | review | ok | lists WordPress posts; on Main it shows them as they were at publishing time |
| Sitemap (`sitemap`) | review | ok | lists WordPress pages, not Main Website pages |
| Menu Cart (`woocommerce-menu-cart`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Archive Products (`wc-archive-products`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Archive Description (`woocommerce-archive-description`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Products (`woocommerce-products`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| WooCommerce Breadcrumbs (`woocommerce-breadcrumb`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Custom Add To Cart (`wc-add-to-cart`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| WooCommerce Pages (`wc-elements`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Categories (`wc-categories`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Title (`woocommerce-product-title`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Images (`woocommerce-product-images`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Price (`woocommerce-product-price`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Add To Cart (`woocommerce-product-add-to-cart`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Rating (`woocommerce-product-rating`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Stock (`woocommerce-product-stock`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Meta (`woocommerce-product-meta`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Short Description (`woocommerce-product-short-description`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Data Tabs (`woocommerce-product-data-tabs`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Additional Information (`woocommerce-product-additional-information`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Product Related (`woocommerce-product-related`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Upsells (`woocommerce-product-upsell`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Checkout (`woocommerce-checkout-page`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Cart (`woocommerce-cart`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| My Account (`woocommerce-my-account`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| Purchase Summary (`woocommerce-purchase-summary`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |
| WooCommerce Notices (`woocommerce-notices`) | blocked | ok | shop, cart and checkout run on the Enrollment website only |

#### metform 4.3.2: 27 widgets

**OK on both websites (27):** Checkbox (`mf-checkbox`), Date (`mf-date`), Email (`mf-email`), File Upload (`mf-file-upload`), First Name (Listing) (`mf-listing-fname`), GDPR Consent (`mf-gdpr-consent`), Last Name (Listing) (`mf-listing-lname`), MetForm (`metform`), Multi Select (`mf-multi-select`), Number (`mf-number`), Opt in ( Listing ) (`mf-listing-optin`), Password (`mf-password`), Radio (`mf-radio`), Range Slider (`mf-range`), Rating (`mf-rating`), reCAPTCHA (`mf-recaptcha`), Select (`mf-select`), Simple Captcha (`mf-simple-captcha`), Simple Message (`mf-simple-message`), Submit Button (`mf-button`), Summary (`mf-summary`), Switch (`mf-switch`), Telephone (`mf-telephone`), Text (`mf-text`), Textarea (`mf-textarea`), Time (`mf-time`), URL (`mf-url`)

#### header-footer-elementor 2.9.5: 13 widgets

**OK on both websites (13):** Basic Posts (`hfe-basic-posts`), Breadcrumbs (`hfe-breadcrumbs-widget`), Copyright (`copyright`), Counter (`hfe-counter`), Info Card (`hfe-infocard`), Navigation Menu (`navigation-menu`), Page Title (`page-title`), Post Info (`post-info-widget`), Retina Logo (`retina`), Search (`hfe-search-button`), Site Logo (`site-logo`), Site Tagline (`hfe-site-tagline`), Site Title (`hfe-site-title`)
