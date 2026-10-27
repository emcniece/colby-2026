#!/usr/bin/env python3
"""Mirror the live NationBuilder site into a self-hostable static site.

Crawls every internal page reachable from the homepage, strips the
NationBuilder runtime (NB JS bundles, CSRF tokens, login modal, FB/Twitter
SDKs, Cloudflare scripts), downloads all theme/content assets locally and
rewrites URLs to point at them, decodes Cloudflare-obfuscated emails, and
makes every form inert (see site/assets/static/static-forms.js).

Usage:  python3 tools/nb-to-static.py https://www.example.ca [output_dir]
        (output_dir defaults to site/ next to this tools/ directory)

Stdlib only. Re-running overwrites the output directory's generated files
but leaves site/assets/static/ (hand-written files) untouched.
"""

import html
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import deque

if len(sys.argv) < 2 or not sys.argv[1].startswith("http"):
    sys.exit(__doc__)
SITE = sys.argv[1].rstrip("/")
SITE_HOST = urllib.parse.urlsplit(SITE).netloc
NB_HOST = None  # e.g. https://<nation>.nationbuilder.com; detected from the homepage in main()
SKIP_PATHS = ("/login", "/logout", "/cdn-cgi", "/forms", "/utils", "/admin", "/users", "/auth", "/assets")
JQUERY = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"

OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "site"))
assets = {}  # remote url (no query) -> local site path


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (nb-to-static)"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.geturl(), r.read()
    except urllib.error.HTTPError as e:
        return e.code, url, e.read()


def write(rel, data):
    path = os.path.join(OUT, urllib.parse.unquote(rel).lstrip("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data if isinstance(data, bytes) else data.encode("utf-8"))


# ── Assets ───────────────────────────────────────────────────────────────────

def local_asset_path(url):
    """Map a remote NB asset URL to a local /assets/... path, or None if not ours."""
    u = urllib.parse.urlsplit(html.unescape(url))
    if u.netloc == "" and u.path.startswith("/assets/"):
        u = urllib.parse.urlsplit(NB_HOST + u.path)
    p = u.path
    # Theme attachments, served from either the NB host or the asset CDN
    m = re.match(r"^/themes/\d+/[0-9a-f]+/\d+/attachments/\d+/default/(.+)$", p) \
        or re.match(r"^/themes/[0-9a-f]+/attachments/original/\d+/(.+)$", p)
    if m and u.netloc.endswith(".nationbuilder.com"):
        name = m.group(1)
        if name == "theme.scss":
            name = "theme.css"
        return "/assets/theme/" + name
    # Page/site content images uploaded through the NB admin
    m = re.match(r"^/(?!assets/|themes/)[a-z0-9_]+/(.+)$", p)
    if m and u.netloc == "assets.nationbuilder.com":
        return "/assets/content/" + m.group(1).replace("/original/", "/")
    # NB platform assets referenced by the compiled theme CSS (payment icons etc.)
    if u.netloc.endswith(".nationbuilder.com") \
            and p.startswith("/assets/") and not p.endswith(".js"):
        return "/assets/nb" + p[len("/assets"):]
    return None


def asset(url, base=None):
    """Download an asset (once) and return its local path; return url unchanged if not ours."""
    full = urllib.parse.urljoin(base, url) if base else url
    local = local_asset_path(full)
    if local is None:
        return url
    key = urllib.parse.urlsplit(html.unescape(full))._replace(query="", fragment="").geturl()
    if key not in assets:
        assets[key] = local
        status, _, data = fetch(html.unescape(full))
        fallback = os.path.join(os.path.dirname(OUT), "files", os.path.basename(local))
        if status != 200 and local.startswith("/assets/theme/") and os.path.isfile(fallback):
            print(f"  WARN asset {status}, using repo copy files/{os.path.basename(local)}: {full}")
            status, data = 200, open(fallback, "rb").read()
        if status != 200:
            print(f"  WARN asset {status}: {full}")
        else:
            if local.endswith(".css"):
                data = rewrite_css(data.decode("utf-8"), html.unescape(full)).encode("utf-8")
            write(local, data)
            print(f"  asset  {local}")
    return local


def rewrite_css(css, base):
    def repl(m):
        ref = m.group(2)
        if ref.startswith("data:"):
            return m.group(0)
        return f"url({m.group(1)}{asset(ref, base)}{m.group(1)})"
    return re.sub(r"url\((['\"]?)([^'\")]+)\1\)", repl, css)


# ── HTML cleanup ─────────────────────────────────────────────────────────────

def cf_decode(hexstr):
    key = int(hexstr[:2], 16)
    return "".join(chr(int(hexstr[i:i + 2], 16) ^ key) for i in range(2, len(hexstr), 2))


def strip_block(text, start_pat, end_pat):
    """Remove the first region from start_pat to the end of end_pat (regex, DOTALL)."""
    return re.sub(start_pat + r".*?" + end_pat, "", text, count=1, flags=re.S)


def clean_head_injection(page):
    """Reduce NB's {{ content_for_header }} to the meta/link tags worth keeping."""
    m = re.search(r"<!-- start of content[ _]for[ _]header -->(.*?)<!-- end of content[ _]for[ _]header -->", page, re.S)
    if not m:
        return page
    block = m.group(1)
    keep = []
    for tag in re.findall(r"<(?:meta|link)\b[^>]*>", block):
        if re.search(r'csrf-|rel="canonical"|jquery-ui|name="Title"', tag):
            continue
        keep.append(tag)
    gtag = re.search(r"<!-- Global site tag.*?</script>\s*<script>.*?</script>", block, re.S)
    if gtag:
        keep.append(gtag.group(0))
    # jQuery + NB stand-ins replace the NB bundles, before any theme script runs
    keep += [f'<script src="{JQUERY}"></script>', '<script src="/assets/static/nb-shim.js"></script>']
    return page[:m.start()] + "\n    ".join(keep) + page[m.end():]


def dedupe_meta(page):
    """The theme's own OG block is partly empty/broken; keep the first good value per key."""
    seen = set()

    def repl(m):
        tag = m.group(0)
        k = re.search(r'(?:property|name)="([^"]+)"', tag)
        c = re.search(r'content="([^"]*)"', tag)
        if not k or not c:
            return tag
        key = k.group(1).lower()
        if c.group(1) in ("", "featured_image") or key in seen:
            return ""
        seen.add(key)
        return tag
    head_end = page.find("</head>")
    head = re.sub(r"<meta\b[^>]*(?:property|name)=\"[^\"]+\"[^>]*>", repl, page[:head_end])
    return head + page[head_end:]


def make_forms_static(page):
    page = re.sub(r'<input name="authenticity_token" type="hidden" value="[^"]*" ?/?>', "", page)
    page = re.sub(r'<input[^>]*name="(?:recaptcha_token|g-recaptcha-response)"[^>]*>', "", page)

    def form(m):
        tag = re.sub(r'\saction="[^"]*"', "", m.group(0))
        return tag[:-1] + ' action="#" data-static-form>'
    return re.sub(r"<form\b[^>]*>", form, page)


def clean(page, path):
    page = clean_head_injection(page)
    page = dedupe_meta(page)

    # NB runtime bundles (jQuery + shim were added in place of content_for_header)
    page = re.sub(r'<script[^>]*src="https://assets\.nationbuilder\.com/assets/[^"]*"[^>]*></script>', "", page)

    # Third-party / platform scripts that have no purpose off NationBuilder
    page = re.sub(r'<script[^>]*src="(?:/cdn-cgi/[^"]*|/assets/liquid/[^"]*|https://js\.stripe\.com/[^"]*|'
                  r'https://www\.recaptcha\.net/[^"]*|https://ga\.jspm\.io/[^"]*|'
                  r'https://static\.cloudflareinsights\.com/[^"]*|/javascripts/[^"]*)"[^>]*></script>', "", page)
    page = strip_block(page, r'<div id="fb-root"></div>\s*', r"\}\(document, 'script', 'facebook-jssdk'\)\);\s*</script>")
    page = re.sub(r"<script>\s*if \( window\.self !== window\.top \).*?</script>", "", page, flags=re.S)
    page = re.sub(r"<script>\(function\(\)\{function c\(\).*?</script>", "", page, flags=re.S)
    page = re.sub(r"<script[^>]*>(?:(?!</script>).)*(?:grecaptcha|TinyMCERails)(?:(?!</script>).)*</script>", "", page, flags=re.S)

    # Login button + supporter-nav modal (no accounts on a static site)
    page = re.sub(r'<li class="navbar-toolbar-item[^"]*">\s*<button(?:(?!</li>).)*data-target="#supporter-nav".*?</li>',
                  "", page, flags=re.S)
    page = strip_block(page, r'<section class="modal fade" id="supporter-nav"', r"</section>")

    # Cloudflare email obfuscation
    page = re.sub(r'href="/cdn-cgi/l/email-protection#([0-9a-f]+)"',
                  lambda m: f'href="mailto:{html.escape(cf_decode(m.group(1)))}"', page)
    page = re.sub(r'<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]</span>',
                  lambda m: html.escape(cf_decode(m.group(1))), page)
    # Cloudflare also rewrites the share-by-email mailto in place
    page = re.sub(r'href="/cdn-cgi/l/email-protection"', 'href="#"', page)

    page = make_forms_static(page)
    page = page.replace("</body>", '  <script src="/assets/static/static-forms.js"></script>\n  </body>', 1)

    # Assets: src/href/srcset/content attributes and inline style url()s
    def attr(m):
        vals = [v.strip() for v in m.group(2).split(",")] if m.group(1) == "srcset" else [m.group(2)]
        out = []
        for v in vals:
            parts = v.split(" ", 1)
            parts[0] = asset(parts[0], SITE + path)
            out.append(" ".join(parts))
        return f'{m.group(1)}="{", ".join(out)}"'
    page = re.sub(r'\b(src|href|srcset|content|data-src|poster)="([^"]+)"', attr, page)
    page = re.sub(r"url\((&quot;|['\"]?)(https://[^)'\"&]+)\1\)",
                  lambda m: f"url({m.group(1)}{asset(m.group(2))}{m.group(1)})", page)
    # Any remaining NB asset URLs, e.g. in data-* attributes or inline JS strings
    page = re.sub(r"https://[a-z0-9-]+\.nationbuilder\.com/[^\s\"'<>)]+", lambda m: asset(m.group(0)), page)

    # Absolute links to our own domain become root-relative (keep canonical/og:url absolute)
    bare_host = re.escape(re.sub(r"^www\.", "", SITE_HOST))
    page = re.sub(rf'href="https?://(?:www\.)?{bare_host}(/[^"]*)?"',
                  lambda m: f'href="{m.group(1) or "/"}"', page)
    page = re.sub(r'(<link rel="canonical" href=")(/[^"]*)"', lambda m: f'{m.group(1)}{SITE}{m.group(2)}"', page)
    page = re.sub(r'(<link rel="image_src" href="|content=")(/assets/)', rf'\1{SITE}\2', page)

    # NB emits hundreds of blank lines from Liquid tags
    page = re.sub(r"\n\s*\n+", "\n", page)
    return page.lstrip()


# ── Crawl ────────────────────────────────────────────────────────────────────

def internal_links(page):
    for href in re.findall(r'href="([^"]+)"', page):
        href = html.unescape(href)
        if href.startswith(SITE):
            href = href[len(SITE):] or "/"
        if not href.startswith("/") or href.startswith("//"):
            continue
        p = urllib.parse.urlsplit(href).path
        if p.startswith(SKIP_PATHS) or re.search(r"\.\w{2,4}$", p):
            continue
        yield p.rstrip("/") or "/"


def out_path(path):
    return "/index.html" if path == "/" else f"{path}/index.html"


def main():
    global NB_HOST
    _, _, home = fetch(SITE + "/")
    m = re.search(r"https://([a-z0-9-]+\.nationbuilder\.com)/themes/", home.decode("utf-8"))
    if not m:
        sys.exit(f"No NationBuilder theme URL found on {SITE}/")
    NB_HOST = "https://" + m.group(1)
    print(f"site {SITE}  (NationBuilder host {NB_HOST})")
    queue, seen = deque(["/"]), {"/"}
    status, _, sm = fetch(SITE + "/sitemap.xml")
    if status == 200:
        for loc in re.findall(r"<loc>([^<]+)</loc>", sm.decode()):
            p = urllib.parse.urlsplit(loc).path.rstrip("/") or "/"
            if p not in seen:
                seen.add(p)
                queue.append(p)

    while queue:
        path = queue.popleft()
        status, final, body = fetch(SITE + path)
        if status != 200 or urllib.parse.urlsplit(final).netloc != urllib.parse.urlsplit(SITE).netloc:
            print(f"  SKIP {status} {path} -> {final}")
            continue
        raw = body.decode("utf-8")
        for link in internal_links(raw):
            if link not in seen:
                seen.add(link)
                queue.append(link)
        write(out_path(path), clean(raw, path))
        print(f"page   {out_path(path)}")

    status, _, body = fetch(SITE + "/this-page-does-not-exist-404")
    write("/404.html", clean(body.decode("utf-8"), "/404"))
    print("page   /404.html")


if __name__ == "__main__":
    main()
