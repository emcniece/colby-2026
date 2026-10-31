#!/usr/bin/env python3
"""Copy site/ to an output folder, prefixing root-relative URLs with a base path.

    python3 tools/set-base-path.py site _site /colby-2026   # served at user.github.io/colby-2026/
    python3 tools/set-base-path.py site _site ""            # served at a domain root: plain copy

The site uses root-relative URLs ("/assets/...", "/about"), which only work
at a domain root. The GitHub Pages workflow runs this with the base path
Pages reports (empty once a custom domain is set). site/ itself is never
modified.

Rewritten: quoted strings starting with "/" whose first path segment exists
at the top of the site ("/", "/assets/...", "/donate", ...) in HTML, CSS and
inline scripts, plus unquoted CSS url(/...). Protocol-relative "//host" URLs
and absolute URLs are left alone.
"""
import pathlib
import re
import shutil
import sys

TEXT = {'.html', '.css', '.js'}


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src, out, base = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3].rstrip('/')
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src, out)
    if not base:
        print('no base path: copied %s to %s unchanged' % (src, out))
        return
    if not base.startswith('/'):
        base = '/' + base

    top = {p.name for p in src.iterdir()}
    quoted = re.compile(r'''(["'])/(?!/)([^"'\s]*)''')
    css_url = re.compile(r'url\(/(?!/)')

    def fix(m):
        first = re.split(r'[/?#]', m.group(2), 1)[0]
        if first == '' or first in top:
            return '%s%s/%s' % (m.group(1), base, m.group(2))
        return m.group(0)

    changed = 0
    for p in out.rglob('*'):
        if p.suffix not in TEXT or not p.is_file():
            continue
        s = p.read_text()
        new = css_url.sub('url(%s/' % base, quoted.sub(fix, s))
        if new != s:
            p.write_text(new)
            changed += 1
    print('rewrote root-relative URLs under %s in %d file(s)' % (base, changed))


if __name__ == '__main__':
    main()
