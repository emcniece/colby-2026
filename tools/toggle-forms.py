#!/usr/bin/env python3
"""Comment out every submission form in site/ and show an email link instead,
or put the forms back.

    python3 tools/toggle-forms.py disable   # forms -> HTML comments + mailto link
    python3 tools/toggle-forms.py enable    # restore the original forms

Disabled blocks look like:

    <!--FORM-DISABLED (restore: python3 tools/toggle-forms.py enable)
    <form ...>...</form>
    FORM-DISABLED-->
    <p class="static-form-email">... <a href="mailto:...">...</a></p><!--/FORM-DISABLED-EMAIL-->

Inside a disabled block any "-->" is stored as "--&gt;" (and "--!>" as
"--!&gt;") so it cannot end the comment early; enable reverses that.
"""
import collections
import html
import pathlib
import re
import sys
from urllib.parse import quote

SITE = pathlib.Path(__file__).resolve().parent.parent / 'site'

# Wrappers whose visible UI lives outside the <form> itself (scripted
# multi-step widgets): the whole wrapper is disabled instead of just the form.
WRAPPERS = ['<div class="priorities-forms">']

# Forms that do not submit anything (e.g. a copy-your-share-link box).
SKIP = [re.compile(r'id="tracking_link"')]

OPEN = '<!--FORM-DISABLED (restore: python3 tools/toggle-forms.py enable)\n'
CLOSE = '\nFORM-DISABLED-->'
EMAIL_END = '<!--/FORM-DISABLED-EMAIL-->'


def site_email():
    counts = collections.Counter()
    for p in SITE.rglob('*.html'):
        counts.update(re.findall(r'mailto:([^"?&\s]+@[^"?&\s]+)', p.read_text()))
    return counts.most_common(1)[0][0]


def message(block, path):
    """(lead-in text, mailto subject) for a disabled form."""
    page = str(path.relative_to(SITE))
    kind = re.search(r'data-form="([^"]+)"', block)
    kind = kind.group(1) if kind else ''
    if 'lawn_sign' in page:
        return 'To request a lawn sign, please email us at', 'Lawn sign request'
    if kind in ('donation', 'pledge'):
        return 'To make a donation, please email us at', 'Donation'
    if kind == 'volunteer_signup':
        return 'Want to volunteer? Email us at', 'Volunteering'
    if kind == 'survey_response' or 'priorities-feedback' in block:
        return 'Tell us what matters most to you. Email us at', 'My priorities'
    if kind in ('feedback', 'blog_post_page', 'user_session') or 'data-ajax-contact' in block:
        return 'To get in touch, please email us at', 'Message from the website'
    return 'To get campaign updates, please email us at', 'Keep me updated'


def find_block_end(s, start):
    """End index of the element opened at s[start] (a <form> or a <div> wrapper)."""
    if s.startswith('<form', start):
        return s.index('</form>', start) + len('</form>')
    depth = 0
    for m in re.compile(r'<div\b|</div>').finditer(s, start):
        depth += 1 if m.group() != '</div>' else -1
        if depth == 0:
            return m.end()
    raise ValueError('unbalanced <div> at %d' % start)


def in_comment(s, i):
    return s.rfind('<!--', 0, i) > s.rfind('-->', 0, i)


def disable(s, path, email):
    out, pos, n = [], 0, 0
    starts = [m.start() for m in re.finditer(r'<form\b', s)]
    starts += [m.start() for w in WRAPPERS for m in re.finditer(re.escape(w), s)]
    for start in sorted(starts):
        if start < pos or in_comment(s, start):
            continue  # inside a wrapper already handled, or already commented
        end = find_block_end(s, start)
        block = s[start:end]
        if any(p.search(block) for p in SKIP):
            continue
        if '--&gt;' in block or '--!&gt;' in block:
            raise ValueError('%s: block at %d would not round-trip' % (path, start))
        lead, subject = message(block, path)
        safe = block.replace('--!>', '--!&gt;').replace('-->', '--&gt;')
        link = 'mailto:%s?subject=%s' % (email, quote(subject))
        out += [s[pos:start], OPEN, safe, CLOSE, '\n',
                '<p class="static-form-email">%s <a href="%s">%s</a>.</p>%s' % (
                    lead, html.escape(link), email, EMAIL_END)]
        pos, n = end, n + 1
    out.append(s[pos:])
    return ''.join(out), n


def enable(s):
    pat = re.compile(re.escape(OPEN) + r'(.*?)' + re.escape(CLOSE) +
                     r'\n<p class="static-form-email">.*?' + re.escape(EMAIL_END), re.S)
    restore = lambda m: m.group(1).replace('--&gt;', '-->').replace('--!&gt;', '--!>')
    return pat.subn(restore, s)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('disable', 'enable'):
        sys.exit(__doc__)
    email = site_email()
    total = 0
    for p in sorted(SITE.rglob('*.html')):
        s = p.read_text()
        if sys.argv[1] == 'disable':
            if OPEN in s:
                continue  # already disabled
            new, n = disable(s, p, email)
        else:
            new, n = enable(s)
        if n:
            p.write_text(new)
            total += n
            print('%-80s %d' % (p.relative_to(SITE), n))
    print('%s: %d block(s)' % (sys.argv[1], total))


if __name__ == '__main__':
    main()
