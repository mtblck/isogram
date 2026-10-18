#!/usr/bin/env python3
"""Build an isogram into drop-in files.

usage: python3 build.py DIAGRAM.js [more.js ...] [--out DIR] [--name NAME]

Writes, next to each other in DIR (default: the diagram's folder):
  NAME.html        preview + export page (look/theme/accent switcher, GIF/PNG/SVG/WebM/sheet buttons, embed code)
  NAME.isogram.js      runtime + diagram(s) as one script: <script src="NAME.isogram.js"></script><iso-gram name="ID"></iso-gram>
  NAME.embed.html  a self-contained snippet to paste into any page (script inline + element)
No dependencies; the kit is read from ../assets/isogram.js next to this script.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.join(HERE, '..', 'assets', 'isogram.js')

def safe(js):  # never let source close the surrounding <script>
    return js.replace('</script', '<\\/script')

def main(argv):
    out, name, files = None, None, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--out': out = argv[i + 1]; i += 2; continue
        if a == '--name': name = argv[i + 1]; i += 2; continue
        files.append(a); i += 1
    if not files:
        print(__doc__); return 1
    kit = open(KIT, encoding='utf-8').read()
    defs = [open(f, encoding='utf-8').read() for f in files]
    ids, titles = [], []
    for src, f in zip(defs, files):
        m = re.search(r"\bid\s*:\s*['\"]([^'\"]+)['\"]", src)
        if not m: raise SystemExit(f'{f}: no id found in ISOGRAM.define({{ id: ... }})')
        ids.append(m.group(1))
        t = re.search(r"\btitle\s*:\s*['\"]([^'\"]+)['\"]", src); titles.append(t.group(1) if t else m.group(1))
    name = name or ids[0]
    out = out or os.path.dirname(os.path.abspath(files[0]))
    os.makedirs(out, exist_ok=True)
    defsrc = '\n'.join(defs)

    bundle = f'/* {name}: isogram runtime + diagram(s) {", ".join(ids)} */\n{kit}\n{defsrc}\n'
    open(os.path.join(out, f'{name}.isogram.js'), 'w', encoding='utf-8').write(bundle)

    elements = '\n'.join(f'<iso-gram name="{d}" fig="{n + 1}"></iso-gram>' for n, d in enumerate(ids))
    embed = (f'<!-- {name}: animated isometric diagram. Attributes: look="glow|vector|pixel|blueprint" theme="auto|light|dark" '
             f'accent="#hex" frame="none" transparent speed="1" paused -->\n'
             f'<script>\n{safe(kit)}\n{safe(defsrc)}\n</script>\n{elements}\n')
    open(os.path.join(out, f'{name}.embed.html'), 'w', encoding='utf-8').write(embed)

    tpl = open(os.path.join(HERE, '..', 'assets', 'preview.html'), encoding='utf-8').read()
    page = (tpl.replace('{{TITLE}}', titles[0])
               .replace('{{NAME}}', name)
               .replace('{{IDS}}', json.dumps(ids))
               .replace('/*{{KIT}}*/', safe(kit))
               .replace('/*{{DEFS}}*/', safe(defsrc)))
    open(os.path.join(out, f'{name}.html'), 'w', encoding='utf-8').write(page)
    for ext in ('html', 'iso.js', 'embed.html'):
        print('wrote', os.path.join(out, f'{name}.{ext}'))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
