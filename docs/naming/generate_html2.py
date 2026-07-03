#!/usr/bin/env python3
import csv, os, html
from collections import defaultdict
DIR = os.path.dirname(os.path.abspath(__file__))

# web-geprüfte Kunstwörter: (name, tier, bedeutung, web-befund)
vetted = [
 ("notapeak","gruen","'nota' (Note) + 'peak' (Gipfel) — deine Noten auf dem Gipfel","Kein Produkt, keine Firma gefunden. Sauber."),
 ("claraura","gruen","'clarus' (klar) + 'aura' (Glanz) — Klarheit mit Strahlkraft","Nur ein paar private Social-Handles, kein Produkt/keine Marke."),
 ("astramens","gruen","'astra' (Sterne) + 'mens' (Geist) — Sternengeist, hoch hinaus","Kein exaktes Produkt. 'Astramen' (Astrologie) ist andere Schreibweise."),
 ("lumigrad","gruen","'lumen' (Licht) + 'gradus' (Stufe/Note) — Licht auf deine Noten","Nur ein Domain-Listing, kein echtes Produkt. Sauber."),
 ("notamens","gruen","'nota' (Note) + 'mens' (Geist) — der Noten-Verstand","Nichts gefunden. Sauber."),
 ("sophrise","gruen","'sophia' (Weisheit) + 'rise' (Aufstieg) — klug aufsteigen","Nur ein Foren-Username, kein Produkt."),
 ("sapipath","gruen","'sapere' (wissen) + 'path' (Pfad) — der Weg des Wissens","Nichts gefunden. Sauber."),
 ("clarmens","gruen","'clarus' (klar) + 'mens' (Geist) — der klare Kopf","Nichts gefunden. Sauber."),
 ("claragrad","gruen","'clarus' (klar) + 'gradus' (Note) — klare Noten","Nur ein privater Social-Handle, kein Produkt."),
 ("gradlux","gelb","'gradus' (Note) + 'lux' (Licht) — Licht auf deinen Noten","'Gradlux GmbH' (DE-Photovoltaik) + slow. Baufirma existieren — andere Branche, aber Name nicht einzigartig."),
 ("sapimind","gelb","'sapere' (wissen) + 'mind' (Geist) — wissender Verstand","'Sapimind Therapeutic LLC' (US, Mental-Health) nutzt den exakten Namen — andere Branche."),
 ("meririse","gelb","'meritum' (Verdienst) + 'rise' (Aufstieg) — durch Leistung aufsteigen","Lautlich nah an 'Memrise' (grosse Lern-App) — Verwechslungsgefahr."),
 ("blicco","gelb","von dt. 'Blick' — der Überblick","Nah an 'Blic'/'Blikk'-Apps (News, Projektmgmt). Kein exaktes Produkt."),
 ("kosmopath","gelb","'kosmos' (Welt) + 'path' (Pfad) — dein Weg durchs Schul-Universum","Ein Musiker 'Kosmopath' (Frankfurt) existiert — andere Branche."),
 ("summirise","gelb","'summus' (höchster) + 'rise' (Aufstieg) — ganz nach oben","Wird leicht als Tippfehler von 'summarize' gelesen."),
]
n_gruen = sum(1 for v in vetted if v[1]=="gruen")

# volle 68er-Liste laden (name->(sprache,bedeutung))
pool = {}
with open(os.path.join(DIR,"pool2.tsv")) as f:
    for r in csv.DictReader(f, delimiter="\t"):
        pool[r["name"]] = (r["sprache"], r["bedeutung"])
free = [l.strip() for l in open(os.path.join(DIR,"both2_free.txt")) if l.strip()]

SPR = {"mix":"Fragment-Fusionen (Latein-/Griechisch-Wurzeln)","lat":"Latein","gr":"Griechisch","de":"Deutsch","eng":"Englisch"}
groups = defaultdict(list)
for n in free:
    spr, bed = pool.get(n,("mix",""))
    groups[spr].append((n,bed))
order = ["mix","lat","gr","de","eng"]

def esc(s): return html.escape(str(s))

parts = ["""<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
@page { size:A4; margin:16mm 14mm; }
*{box-sizing:border-box;} body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#10131a;margin:0;font-size:10.5px;line-height:1.45;}
h1{font-size:30px;margin:0 0 4px;letter-spacing:-.5px;} h2{font-size:17px;margin:24px 0 8px;color:#0b3a63;border-bottom:2px solid #1da1ff;padding-bottom:4px;}
h3{font-size:13px;margin:16px 0 5px;color:#3730a3;}
.cover{page-break-after:always;padding-top:24px;} .sub{color:#5b6472;font-size:13px;margin:0 0 18px;}
.statbox{display:flex;gap:9px;margin:18px 0;} .stat{flex:1;background:linear-gradient(135deg,#1da1ff,#4338ca);color:#fff;border-radius:12px;padding:12px 14px;}
.stat .n{font-size:22px;font-weight:700;display:block;} .stat .l{font-size:9px;opacity:.92;}
.note{background:#f1f5fb;border-left:4px solid #1da1ff;padding:10px 14px;border-radius:6px;margin:11px 0;font-size:10px;}
.warn{background:#fff7ed;border-left:4px solid #f59e0b;} .ok{background:#f0fdf4;border-left:4px solid #16a34a;}
table{width:100%;border-collapse:collapse;margin:6px 0;} thead{display:table-header-group;}
th{background:#0b3a63;color:#fff;text-align:left;padding:6px 8px;font-size:10px;font-weight:600;}
td{padding:5px 8px;border-bottom:1px solid #e5e9f0;vertical-align:top;} tr:nth-child(even) td{background:#f7f9fc;}
.name{font-weight:700;color:#0b3a63;white-space:nowrap;} .dom{font-family:'SF Mono',Menlo,monospace;font-size:9px;color:#16a34a;white-space:nowrap;}
.foot{color:#8b94a3;font-size:9px;margin-top:8px;} .kicker{color:#1da1ff;font-weight:700;letter-spacing:2px;font-size:11px;text-transform:uppercase;}
.tier-gruen td:first-child{box-shadow:inset 4px 0 0 #16a34a;} .tier-gelb td:first-child{box-shadow:inset 4px 0 0 #f59e0b;}
ol.steps{margin:6px 0 0 18px;padding:0;} ol.steps li{margin-bottom:5px;}
</style></head><body>"""]

parts.append(f"""<div class="cover">
<div class="kicker">Project X · Naming v3 · Kunstwörter</div>
<h1>Namens-Kandidaten</h1>
<p class="sub">Kurze &amp; mittellange Kunstwörter aus echten Wurzeln (Latein · Griechisch · Deutsch · Englisch)<br>mit Bedeutung — .com &amp; .app frei — erstellt am 26.06.2026 für Nepomuk</p>
<div class="statbox">
 <div class="stat"><span class="n">657</span><span class="l">Namen generiert &amp; geprüft</span></div>
 <div class="stat"><span class="n">68</span><span class="l">.com UND .app frei</span></div>
 <div class="stat"><span class="n">15</span><span class="l">web-geprüft</span></div>
 <div class="stat"><span class="n">{n_gruen}</span><span class="l">grün empfohlen</span></div>
</div>
<div class="note warn"><b>Die harte Wahrheit zuerst, Nepomuk:</b> Jedes <b>echte, schöne Wort</b> (scala, claria, sapia, astra, sophia, lumen …) ist längst vergeben — und zwar auf <b>.com, .app, .io UND .de gleichzeitig</b>. Ich hab's geprüft: praktisch alles weg. Für 0&nbsp;€ bekommst du nur <b>erfundene Kunstwörter</b>. Genau die hast du beschrieben ("nur die Hälfte mancher Wörter zusammensetzen") — also bauen wir aus echten Wurzeln neue, eigene Namen.</div>
<div class="note ok"><b>Der Vorteil von Kunstwörtern:</b> Sie kollidieren kaum mit bestehenden Marken — von 15 geprüften sind <b>{n_gruen} komplett sauber</b>, der Rest nur mit kleinen Nebentreffern. Das ist viel besser als bei echten Wörtern.</div>
<div class="note"><b>Methodik:</b> 657 Kunstwörter aus echten Wurzeln (lat/gr/de/eng) + Fragment-Fusionen generiert. Domain-Verfügbarkeit (.com &amp; .app) hart per RDAP verifiziert (Verisign + Google), Stand 26.06.2026. Die 15 stärksten zusätzlich per Websuche auf bestehende Produkte/Marken geprüft.</div>
<div class="note warn"><b>Vor der finalen Entscheidung noch selbst erledigen</b> (nicht automatisierbar):
<ol class="steps">
<li><b>DPMA-Marken-Check</b> (rechtsverbindlich): kostenlos auf <b>register.dpma.de</b> → Marken-Recherche, Klassen 9/41/42. Plus EU auf <b>tmview.org</b>.</li>
<li><b>Social-Handles</b> (Instagram/TikTok/X) manuell aufrufen &amp; sofort sichern.</li>
<li><b>Google-Vollcheck</b> deines Favoriten (für die Top 15 schon erledigt).</li>
</ol>
Preise: .com ca. 10–12&nbsp;€/Jahr, .app ca. 12–16&nbsp;€/Jahr.</div>
</div>""")

# Ampel
for tier,titel,intro in [
 ("gruen","🟢 Grün — sauber &amp; empfohlen","Kein konkurrierendes Produkt/keine Marke gefunden. Meine Favoriten."),
 ("gelb","🟡 Gelb — frei, aber mit Vorsicht","Domains frei, aber ähnlicher Name/Firma in anderer Branche oder kleiner Nebentreffer."),
]:
    rows=[v for v in vetted if v[1]==tier]
    if tier=="gruen": parts.append('<h2>Geprüfte Empfehlung — Ampel der Top 15</h2>')
    parts.append(f'<h3>{titel} <span style="color:#8b94a3;font-weight:400">({len(rows)})</span></h3>')
    parts.append(f'<p style="margin:2px 0 6px;color:#5b6472;font-size:10px">{intro}</p>')
    parts.append('<table><thead><tr><th style="width:13%">Name</th><th style="width:10%">Domains</th><th style="width:38%">Bedeutung</th><th>Web-Befund</th></tr></thead><tbody>')
    for name,t,bed,fund in rows:
        parts.append(f'<tr class="tier-{t}"><td class="name">{esc(name)}</td><td class="dom">.com ✓ .app ✓</td><td>{esc(bed)}</td><td>{esc(fund)}</td></tr>')
    parts.append('</tbody></table>')

# Volle Liste
parts.append('<h2 style="page-break-before:always;">Alle 68 freien Kunstwörter — nach Herkunft</h2>')
parts.append('<p class="sub" style="margin-top:0">Jeder Name ist auf <b>.com</b> und <b>.app</b> frei (RDAP-verifiziert). Nur die oben 15 sind zusätzlich web-geprüft — bei den anderen den Marken-Check vor der Wahl selbst machen.</p>')
for spr in order:
    if spr not in groups: continue
    rows=sorted(groups[spr])
    parts.append(f'<h3>{esc(SPR[spr])} <span style="color:#8b94a3;font-weight:400">({len(rows)})</span></h3>')
    parts.append('<table><thead><tr><th style="width:16%">Name</th><th style="width:13%">Domains</th><th>Bedeutung / Herkunft</th></tr></thead><tbody>')
    for n,bed in rows:
        parts.append(f'<tr><td class="name">{esc(n)}</td><td class="dom">.com ✓ .app ✓</td><td>{esc(bed)}</td></tr>')
    parts.append('</tbody></table>')

parts.append('<p class="foot" style="margin-top:18px">Generiert mit Claude Code · Domain-Check per RDAP, Web-Check per Suche, 26.06.2026 · Verfügbarkeit &amp; Marken können sich ändern — vor Registrierung erneut prüfen. Keine Rechtsberatung.</p></body></html>')

with open(os.path.join(DIR,"namen2.html"),"w") as f: f.write("\n".join(parts))
print("HTML ok. Frei gesamt:",len(free),"| grün:",n_gruen)
