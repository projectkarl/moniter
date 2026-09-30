from pathlib import Path
from html.parser import HTMLParser
import re, sys
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
css=(root/'public/styles.css').read_text()
errors=[]; notes=[]
class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        for k in ('src','href'):
            v=a.get(k,'')
            if v.startswith('/') and not v.startswith('//'): self.refs.append(v.split('?',1)[0].split('#',1)[0])
p=P(); p.feed(html)
seen=set(); dup=[]
for x in p.ids:
    if x in seen: dup.append(x)
    seen.add(x)
if dup: errors.append('duplicate ids: '+', '.join(sorted(set(dup))))
for ref in sorted(set(p.refs)):
    if ref in ('/',''): continue
    target=root/'public'/ref.lstrip('/')
    if not target.exists(): errors.append(f'missing local asset: {ref}')
if '\\n' in css: errors.append('literal \\n remains in CSS')
if 'width=device-width, initial-scale=1, viewport-fit=cover' not in html: errors.append('viewport meta missing')
for needle in ('@media(max-width:920px)','@media(max-width:520px)','orientation:landscape','max-width:calc(100vw - 12px)'):
    if needle not in css: errors.append(f'mobile rule missing: {needle}')
try:
    import tinycss2
    rules=tinycss2.parse_stylesheet(css,skip_comments=False,skip_whitespace=True)
    parse_errors=[r for r in rules if getattr(r,'type',None)=='error']
    if parse_errors: errors.append(f'CSS top-level parse errors: {len(parse_errors)}')
    else: notes.append(f'CSS parsed: {len(rules)} top-level rules, 0 parse errors')
except Exception as e:
    notes.append(f'tinycss2 unavailable: {e}')
# Guard against known regression that used nearby cameras under the wrong identity.
app=(root/'public/app.js').read_text()
if 'renderNearbyCctvWidget(' in app: errors.append('silent nearby-CCTV substitution helper still present')
if '不會自動替換成其他位置的攝影機' not in app: errors.append('CCTV correctness placeholder missing')
print('PAGE AUDIT')
for n in notes: print('✓',n)
print('✓ HTML ids unique' if not dup else '✗ duplicate ids')
print(f'✓ Local refs checked: {len(set(p.refs))}')
if errors:
    for e in errors: print('✗',e)
    sys.exit(1)
print('PAGE AUDIT PASSED')
