# AGENTS.md — Re-Elect Colby Harder 2026

Read this first. It is written for a person or coding agent picking this repo up again, possibly years later (the next BC municipal general election is expected in **October 2030**).

## Status (as of 2026-10-26)

- The site **used to run on NationBuilder** (NB). NB is being **deprecated entirely**; the site is moving to a static host.
- **`site/` is the source of truth.** It is a plain static website (HTML/CSS/JS, no build step). Edit it directly.
- Everything else (`templates/`, `stylesheets/`, `javascripts/`, `files/`, `downloaded-from-nb/`, `deploy.sh`, `commit.sh`, `upload-to-nb/`) is the **archived NationBuilder theme**, kept for reference only. Nothing reads it any more.
- The NationBuilder deploy GitHub Action is **disabled**: it was moved from `.github/workflows/` to `.github/disabled-workflows/deploy-nationbuilder.yml`, so it never runs. Do not move it back unless you are deliberately reviving NationBuilder.
- **Hosting is not set up yet.** As of this date the domain still pointed at NationBuilder's proxy. See [Hosting](#hosting).
- **Forms do not submit anywhere.** See [Forms](#forms).
- 2026 campaign context: election day was **October 17, 2026**. Sibling sites built the same way: `kim-2026` (www.kimberleyguiry.ca) and `keith-2026` (www.keithyacucha.ca).

## Quick start

```bash
npx serve@14.2.4 site        # preview at http://localhost:3000 (clean URLs + 404.html)
```

Commit with plain `git` (`git add … && git commit`). `commit.sh` only matters for the NationBuilder flow; using it is harmless but unnecessary.

## Repository layout

```
site/                       THE WEBSITE — deploy this folder as the web root
  index.html                homepage
  <slug>/index.html         every other page (clean URLs: /about → about/index.html)
  404.html                  not-found page
  assets/theme/             theme CSS (compiled theme.css), JS, images, fonts
  assets/content/           images that had been uploaded through the NB admin (page/meta images)
  assets/nb/                a few NB platform images referenced by theme.css (payment icons etc.)
  assets/static/            hand-written glue for running without NB:
    nb-shim.js              stubs the NB JS globals the theme scripts expect
    static-forms.js         makes every form inert (see Forms)
tools/nb-to-static.py       the one-off NB → static mirroring script (needs a live NB site; see below)
docs/nationbuilder-theme.md archived NB-era developer guide (Liquid conventions, Figma tokens, components)
.github/disabled-workflows/ archived NB deploy Action
templates/ stylesheets/ javascripts/ files/ downloaded-from-nb/   archived NB theme source
```

## How the static site was made

On 2026-10-26 `tools/nb-to-static.py https://www.colbyharder.ca` crawled the live NB site and:

- saved every internal page reachable from the homepage/sitemap (37 pages + `404.html`);
- removed the NB runtime: NB JS bundles, CSRF tokens, login button + sign-in modal, Facebook/Twitter SDKs, reCAPTCHA, Stripe, Cloudflare scripts;
- replaced NB's bundled jQuery with jQuery 3.7.1 from cdnjs plus `assets/static/nb-shim.js`;
- downloaded all theme and content assets into `site/assets/` and rewrote URLs to root-relative `/assets/...`;
- decoded Cloudflare-obfuscated email links back to plain `mailto:`;
- rewrote every `<form>` to `action="#" data-static-form` and appended `static-forms.js` to every page.

Verified at the time: every page loaded in headless Chrome with no JS errors, no failed requests and no requests to NationBuilder, and page heights matched the live NB site (except `/donate`, which lacks the Stripe card element).

**The script cannot be re-run once the NB site is gone**, and re-running it while NB is up overwrites any hand edits to `site/**/*.html`. Treat it as historical documentation of the transformation.

### What did NOT carry over

- **Supporter data** (people, sign-ups, donations, survey responses, volunteer lists, email lists) lives in the NationBuilder database, not in this repo. It must be exported from NB before the account is closed; nothing here can recover it.
- **Unpublished theme edits**: anything committed to `templates/`/`stylesheets/` but never deployed to NB is not in `site/`. The mirror reflects what was live. Check [Site-specific notes](#site-specific-notes) for known undeployed work.
- **Logins, donations/payments, petitions, event RSVPs** — anything that needed NB's backend.

## Editing the site

- Content is plain HTML in `site/**/index.html`. The header/nav and footer are **duplicated in every page** (there is no templating). To change the nav, footer, or anything sitewide, edit all pages, e.g. with a script or `sed` across `site/**/*.html`, and check with `git diff`.
- Styles: edit `site/assets/theme/theme.css` directly (it is NB's compiled output of `stylesheets/theme.scss`; URLs inside it were rewritten to `/assets/...`). `stylesheets/theme.scss` still compiles with `npx sass@1.77.8 --load-path=stylesheets stylesheets/theme.scss`, but its asset URLs are NB-style bare filenames, so recompiling into `site/` needs those URLs fixed — prefer editing the CSS.
- New page: copy an existing `site/<slug>/index.html` into a new folder, update `<title>`, meta/OG tags, canonical URL and body content, and add it to the nav on every page.
- Images: put new files in `site/assets/content/` (or `assets/theme/`) and reference them root-relatively (`/assets/...`).
- Absolute URLs: `<link rel="canonical">`, `og:url`, `og:image` use `https://www.colbyharder.ca`. Update them if the domain changes.

### Things that will be stale in 2030

Search before relaunching:

- Election date and year: `grep -rn "October 17\|2026" site --include='*.html'` (titles, hero copy, donate page, footer, calendar `.ics` data URI).
- Elections BC disclosure text ("Authorized by … Financial Agent") in the footer of every page.
- Third-party embeds and links (news articles, Instagram/Facebook embeds) may have rotted.
- Google Analytics property `G-N8C5JVKLY5` (gtag snippet in every page `<head>`): confirm it still exists/is wanted, or remove/replace it.
- CDN dependencies (pinned versions; confirm they still resolve, or vendor them into `site/assets/`):
  - `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css`
  - `https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/object-fit-images/3.2.4/ofi.min.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js`
  - `https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js`
  - Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`)

## Forms

Nothing is submitted anywhere. `site/assets/static/static-forms.js`:

- blocks ordinary form submits and shows a notice ("Online forms are being moved … please email us");
- intercepts scripted `fetch()` POSTs to `#` or `/forms/...` and returns a **fake 200**, so multi-step/scripted forms show their normal success message. **That success message is a lie until a backend exists** — fix this before real visitors use the site.

To connect a backend: give each `<form>` a real `action` (or change the scripts' `fetch` target), then delete or narrow `static-forms.js`. Field names are NationBuilder-style (`signup[email]`, `feedback[content]`, …); a new backend can accept them or the forms can be renamed.

`/donate` cannot take payments (the Stripe element was NB-hosted, and NB's JS also injected the Province field). Either link to an external donation processor, remove the page, or rebuild the form against a new payment provider.

Form inventory at mirror time (hidden/system fields such as `page_id`, `return_to`, honeypots omitted):

- **donation** on `/donate`: `donation[donation_occurrence]`, `donation[amount_option]`, `donation[amount]`, `donation[first_name]`, `donation[last_name]`, `donation[email]`, `donation[billing_address_attributes][phone_number]`, `donation[email_opt_in]`, `donation[billing_address_attributes][address1]`, `donation[billing_address_attributes][address2]`, `donation[billing_address_attributes][address3]`, `donation[billing_address_attributes][country_code]`, `donation[billing_address_attributes][city]`, `donation[billing_address_attributes][state]` …
- **feedback** on `/`: `feedback[content]`, `feedback[first_name]`, `feedback[last_name]`, `feedback[email]`
- **feedback** on `/feedback`: `feedback[content]`, `feedback[first_name]`, `feedback[last_name]`, `feedback[email]`, `feedback[mobile_number]`, `feedback[email_opt_in]`, `feedback[mobile_opt_in]`, `feedback[submitted_address]`
- **feedback** on `/contact`: `feedback[content]`, `feedback[first_name]`, `feedback[last_name]`, `feedback[email]`, `feedback[mobile_number]`, `feedback[email_opt_in]`, `feedback[mobile_opt_in]`, `feedback[submitted_address]`, `feedback[is_volunteer]`
- **pledge** on `/moneybomb`: `pledge[amount_option]`, `pledge[amount]`, `pledge[first_name]`, `pledge[last_name]`, `pledge[email]`, `pledge[mobile_number]`, `pledge[email_opt_in]`, `pledge[mobile_opt_in]`, `pledge[submitted_address]`, `pledge[is_volunteer]`
- **priorities-signup-embed__form** on `/`: `signup[first_name]`, `signup[last_name]`, `signup[email]`, `signup[mobile_number]`, `signup[email_opt_in]`, `signup[mobile_opt_in]`, `signup[is_volunteer]`
- **signup** on `/signup-priorities`: `signup[first_name]`, `signup[last_name]`, `signup[email]`, `signup[mobile_number]`, `signup[email_opt_in]`, `signup[mobile_opt_in]`, `signup[is_volunteer]`, `signup[recruiter_id]`, `signup[author_id]`
- **signup** on `/get_a_lawn_sign`: `signup[first_name]`, `signup[last_name]`, `signup[email]`, `signup[mobile_number]`, `signup[email_opt_in]`, `signup[mobile_opt_in]`, `signup[submitted_address]`, `signup[country_code]`, `signup[recruiter_id]`, `signup[author_id]`
- **signup** on `/bear_aware_securing_your_trash_could_become_a_municipal_bylaw_across_the_crd`, `/broke_ground_on_a_new_arts_culture_and_childcare_centre`, `/clean_up_our_own_mess_langford_floats_idea_of_city_run_waste_collection`, `/comment_building_langford_s_future_a_strategic_investment_in_tomorrow` +20 more: `signup[first_name]`, `signup[last_name]`, `signup[email]`, `signup[mobile_number]`, `signup[submitted_address]`, `signup[country_code]`, `signup[labeled_tags][]`, `signup[activity_is_private]`
- **survey_response** on `/2026-survey`: `survey_question_response[survey_question_id]`, `survey_question_response[survey_question_possible_response_id]`, `survey_response[first_name]`, `survey_response[last_name]`, `survey_response[email]`, `survey_response[mobile_number]`, `survey_response[email_opt_in]`, `survey_response[mobile_opt_in]`, `survey_response[submitted_address]`, `survey_response[is_volunteer]`
- **volunteer_signup** on `/get-involved`: `volunteer_signup[volunteer_type_ids][]`, `volunteer_signup[first_name]`, `volunteer_signup[last_name]`, `volunteer_signup[email]`, `volunteer_signup[mobile_number]`, `volunteer_signup[email_opt_in]`, `volunteer_signup[mobile_opt_in]`, `volunteer_signup[phone_number]`, `volunteer_signup[phone_time]`, `volunteer_signup[submitted_address]`, `volunteer_signup[availability]`, `volunteer_signup[content]`

### Known dead links (NationBuilder-only features)

These pointed at NB account/RSS features that no static host provides. Remove them, or the surrounding "sign in"/"subscribe" UI, when convenient:

- `/media.rss` (on 13 pages, e.g. `/bear_aware_securing_your_trash_could_become_a_municipal_bylaw_across_the_crd`)
- `/progress.rss` (on 13 pages, e.g. `/broke_ground_on_a_new_arts_culture_and_childcare_centre`)
- `/stylesheets/countdown_ie.css` (on 1 page, e.g. `/moneybomb`)

## Hosting

Requirements for any static host:

- Serve `site/` as the **domain root** (paths are root-relative `/assets/...`; a sub-path such as `user.github.io/repo/` breaks them unless rewritten).
- Directory index (`/about` → `/about/index.html`, with or without trailing slash) and `404.html` as the not-found page. GitHub Pages, Netlify, Cloudflare Pages and `npx serve` all do this by default.
- GitHub Pages notes: it cannot publish from `site/` directly (only `/` or `/docs`), so use a Pages Actions workflow that uploads `site/`; private repos need a paid plan; add `site/CNAME` containing `www.colbyharder.ca`.
- DNS (as of 2026-10-26): `www.colbyharder.ca` was a CNAME to a NationBuilder proxy. Repoint it (and the apex domain) to the new host before NB is shut off, or the site goes down.

## NationBuilder reference (archived)

| | |
|---|---|
| Public domain | `https://www.colbyharder.ca` |
| NB host | `langford2026electioncampaign.nationbuilder.com` |
| NB site id / theme id | `1` / `6a35a28b1c12ee3267034f74` |
| Admin | `https://<NB host>/admin/sites/1/themes/6a35a28b1c12ee3267034f74` |
| Deploy | `.github/disabled-workflows/deploy-nationbuilder.yml` ran `deploy.sh --upload` with the `NB_COOKIES` repo secret (an NB admin session cookie). That secret is now useless and can be deleted. |

`docs/nationbuilder-theme.md` is the full NB-era guide (Liquid rules, upload paths, Figma workflow). `downloaded-from-nb/` is the pristine theme as downloaded from NB.

To **revive** NationBuilder (unlikely): restore the workflow file to `.github/workflows/`, refresh the `NB_COOKIES` secret, and follow `docs/nationbuilder-theme.md`. Note that `site/` would then be out of sync with NB.

## Site-specific notes

- The homepage "priorities" block is a two-step flow (survey → sign-up) driven by inline scripts that `fetch()` the form `action`. `static-forms.js` fakes a success response, so both steps advance and end on "I'll be in touch" **without saving anything**.
- `/feedback`, `/signup-priorities`, `/2026-survey` and `/moneybomb` are NationBuilder backing pages (form return targets, an unused pledge page). They are not in the nav; they were mirrored because they were reachable. Delete them if unwanted.
- `/priorities` (linked from the old login modal) and `/join` were already 404/403 on NationBuilder, so they do not exist here.
- Design tokens/components are documented in `docs/nationbuilder-theme.md` (Figma-derived; the tokens also live at the bottom of `stylesheets/theme.scss`).
