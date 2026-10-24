#!/usr/bin/env python3
"""Build the game from src/ into the two single-file outputs.

  python3 tools/build.py          # build + syntax check (node --check, if node is installed)
  python3 tools/build.py --verify # also fail if the result differs from the committed mallow-tactics.html

src/page.html is the page skeleton; each line '@@include <path>' is replaced by that file under src/, in order.
All scripts share one <script> tag, so file order matters (see docs/CODEMAP.md).
Outputs (never edit them by hand, they are overwritten):
  mallow-tactics.html  artifact version (no <!doctype>/<html> wrapper)
  index.html           standalone version, opens directly in a browser
"""
import os, re, subprocess, sys, tempfile, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

def build():
    out = []
    with open(os.path.join(SRC, 'page.html'), encoding='utf-8') as f:
        for line in f:
            m = re.match(r'^@@include (\S+)\n?$', line)
            if not m:
                out.append(line); continue
            with open(os.path.join(SRC, m.group(1)), encoding='utf-8') as part:
                text = part.read()
            if text and not text.endswith('\n'): text += '\n'
            out.append(text)
    return ''.join(out)

def syntax_check(html):
    node = shutil.which('node')
    if not node:
        print('node not found: syntax check skipped'); return True
    js = '\n'.join(re.findall(r'<script>(.*?)</script>', html, re.S))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write(js); path = t.name
    r = subprocess.run([node, '--check', path], capture_output=True, text=True)
    os.unlink(path)
    if r.returncode:
        print('SYNTAX ERROR\n' + r.stderr); return False
    print('syntax ok'); return True

def main():
    html = build()
    art = os.path.join(ROOT, 'mallow-tactics.html')
    if '--verify' in sys.argv:
        with open(art, encoding='utf-8') as f:
            same = f.read() == html
        print('verify: identical' if same else 'verify: DIFFERENT'); 
        if not same: sys.exit(1)
    if not syntax_check(html): sys.exit(1)
    with open(art, 'w', encoding='utf-8') as f: f.write(html)
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write('<!doctype html>\n<html lang="ko">\n' + html + '\n</html>\n')
    print('built mallow-tactics.html + index.html')

if __name__ == '__main__':
    main()
