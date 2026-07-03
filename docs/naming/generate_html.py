#!/usr/bin/env python3
import csv, os, html
from collections import defaultdict
DIR = os.path.dirname(os.path.abspath(__file__))

# Web-geprüfte Kandidaten: (name, tier, bedeutung, befund)
vetted = [
 # ---- GRÜN: sauber, empfohlen ----
 ("notenflow","gruen","Deine Noten im Flow","Kein Produkt mit diesem Namen. Konkurrent 'Notenapp' existiert (anderer Name). Domains frei."),
 ("schulkosmos","gruen","Dein ganzes Schul-Universum","Keine App/Firma gefunden. Marke 'Kosmos' (Verlag) existiert, das Kompositum ist aber eigenständig."),
 ("punktflow","gruen","Punkte im Fluss — 15-Punkte-System","Kein exaktes Produkt. 'PointFlow' (engl., Energie/IT) in anderer Branche & Sprache."),
 ("schulpuls","gruen","Der Puls deines Schullebens","Nur ein loser Schul-Podcast trägt den Namen. Kein Produkt, keine Marke."),
 ("notenrise","gruen","Der Aufstieg deiner Noten","Kein Produkt gefunden. Domains frei."),
 ("zielrise","gruen","Aufstieg zu deinem Ziel","Kein Produkt gefunden (nur Gaming-/DSL-Jargon)."),
 ("schulrise","gruen","Dein Schul-Aufstieg","Kein Produkt, keine Marke gefunden."),
 ("schulscope","gruen","Dein Schul-Blickfeld","Kein Produkt, keine Marke gefunden."),
 ("lernpeak","gruen","Lernen auf dem Gipfel","Kein exaktes Produkt. Ähnliche Namen (Learnpeaks, LeanPeak-Supplement) unkritisch."),
 ("gipfelo","gruen","Kurzes Kunstwort aus 'Gipfel'","Kein Produkt. Nur lautlicher Anklang an 'Gipfeli' (CH-Croissant) — vernachlässigbar."),
 ("elanpilot","gruen","Mit Elan (Schwung) gesteuert","Kein exaktes Produkt gefunden."),
 ("notennord","gruen","Dein fester Norden im Schulalltag","Kein Produkt, keine Marke gefunden."),
 # ---- GELB: frei, aber Vorsicht ----
 ("notenpuls","gelb","Der Puls deiner Noten","Frei, aber 'Notenpuls' ist auch ein Musik-Begriff (Notenpult/Drumming). Keine App-Kollision."),
 ("kaizengrade","gelb","Kaizen = ständige Verbesserung","Frei, aber 'Kaizen' ist sehr generisch und vielgenutzt (Consulting, Spiele, Firmen)."),
 ("punktkonto","gelb","Dein Punktekonto — 15-Punkte-System","Generisches Wörterbuch-Wort (Ärzte-Fortbildung; Flensburg-Verkehrspunkte = leicht negativ). Schwer schützbar."),
 ("notenkonto","gelb","Dein Noten-Guthaben","Generischer Begriff, kein Produkt — aber wenig markenfähig."),
 ("notenradar","gelb","Alles im Blick — Klausuren & Trends","notenradar.nl ist ein NL-Nüsse-Preisvergleich (andere Branche & Land)."),
 ("notensync","gelb","Deine Noten synchron","Frei, klingt aber generisch; 'CloudSync' ist ein Feature bei Konkurrenz-Tools."),
 ("zielsync","gelb","Synchron auf dein Ziel","Frei, aber generischer Tech-Begriff."),
 ("taktpilot","gelb","Dein Schul-Rhythmus, gesteuert","Ein Musiker 'Taktpilot' existiert (Spotify/SoundCloud), sonst frei."),
 ("notenkompass","gelb","Orientierung im Noten-Dschungel","notenkompass.de in Gebrauch (Bigband Augsburg) + IG-Handle vergeben + generischer Schul-Begriff."),
 ("stellapeak","gelb","Sternen-Gipfel, premium","Domains frei, aber Marken 'StellaPeak'/'StellarPeak' existieren (Investment) — Verwechslungsgefahr."),
 ("zielflow","gelb","Im Flow zum Ziel","Sehr nah an etablierter SaaS 'Ziflow' — Verwechslungs- & Markenrisiko."),
 ("abimind","gelb","Dein Abi-Verstand","Frei (nur eine brasilianische Kirche trägt den Namen), aber Klang etwas sperrig."),
 # ---- ROT: abraten, bestehendes Produkt im ähnlichen Feld ----
 ("zielpilot","rot","KI-Lerncoach — direkter Konkurrent","zielpilot.de ist ein KI-Lerncoach für Schüler — exakt gleicher Name UND Zielgruppe. Finger weg."),
 ("punktpilot","rot","Uni-Korrektur-Tool","'PunktPilot' (Jan Bakalorz) ist ein gefördertes Startup (TH OWL) fürs Klausur-Korrigieren. Gleiche Branche."),
 ("notenhub","rot","Bestehender Notenrechner","notenhub.ch ist ein Notenrechner — exakt unser Kern-Feature. Branche besetzt."),
 ("notendeck","rot","Bestehende Lern-App","'NoteDeck' (note-deck.app) ist eine KI-Flashcard-App. Gleiche Branche, .app-Variante belegt."),
 ("fokuspilot","rot","Mehrere FocusPilot-Apps","Produktivitäts-Apps + sogar focuspilot.app (Classroom-Tool) existieren."),
 ("fokusflow","rot","Viele FocusFlow-Apps","focusflow.app + zahlreiche 'FocusFlow'-Apps (Google Play, Apple, Windows)."),
 ("lerngipfel","rot","Bildungsverein lerngipfel.de","'Lerngipfel e.V.' ist ein aktiver Nachhilfe-Verein. Gleiche Branche."),
 ("zielkompass","rot","Coaching-Marke","'Zielkompass' ist eine kommerzielle Coaching-Methode + Kurse (zielkompass.com/.de)."),
 ("lernsync","rot","Edtech-Marke LearnSync","'LearnSync' = mehrere Edtech-Marken & Firmen (Crunchbase, AI-Learning). Zu nah dran."),
]

# Volle Liste laden
cats = defaultdict(list)
with open(os.path.join(DIR, "meanings.tsv")) as f:
    for row in csv.DictReader(f, delimiter="\t"):
        cats[row["kategorie"]].append(row)
CATORD = ["Noten","Aufstieg","Lernen","Schule","Abitur","Ziel","Fokus","Klarheit",
          "Orientierung","Momentum","Leistung","Werte","Geist","Sterne","Zukunft",
          "Cockpit","Sonstige"]
order = [c for c in CATORD if c in cats] + [c for c in cats if c not in CATORD]

def esc(s): return html.escape(str(s))
TIERLABEL = {"gruen":("🟢 Sauber","gruen"),"gelb":("🟡 Vorsicht","gelb"),"rot":("🔴 Abraten","rot")}
n_gruen = sum(1 for v in vetted if v[1]=="gruen")

parts = []
parts.append("""<!doctype html><html lang="de"><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system,'Helvetica Neue',Arial,sans-serif; color:#10131a; margin:0; font-size:10.5px; line-height:1.45; }
h1 { font-size:30px; margin:0 0 4px; letter-spacing:-.5px; }
h2 { font-size:17px; margin:24px 0 8px; color:#0b3a63; border-bottom:2px solid #1da1ff; padding-bottom:4px; }
h3 { font-size:13px; margin:16px 0 5px; color:#3730a3; }
.cover { page-break-after: always; padding-top:26px; }
.sub { color:#5b6472; font-size:13px; margin:0 0 20px; }
.statbox { display:flex; gap:10px; margin:20px 0; }
.stat { flex:1; background:linear-gradient(135deg,#1da1ff,#4338ca); color:#fff; border-radius:12px; padding:13px 15px; }
.stat .n { font-size:24px; font-weight:700; display:block; }
.stat .l { font-size:9.5px; opacity:.92; }
.note { background:#f1f5fb; border-left:4px solid #1da1ff; padding:10px 14px; border-radius:6px; margin:12px 0; font-size:10px; }
.warn { background:#fff7ed; border-left:4px solid #f59e0b; }
.ok { background:#f0fdf4; border-left:4px solid #16a34a; }
table { width:100%; border-collapse:collapse; margin:6px 0 4px; }
thead { display:table-header-group; }
th { background:#0b3a63; color:#fff; text-align:left; padding:6px 8px; font-size:10px; font-weight:600; }
td { padding:5px 8px; border-bottom:1px solid #e5e9f0; vertical-align:top; }
tr:nth-child(even) td { background:#f7f9fc; }
.name { font-weight:700; color:#0b3a63; white-space:nowrap; }
.dom { font-family:'SF Mono',Menlo,monospace; font-size:9px; color:#16a34a; white-space:nowrap; }
.foot { color:#8b94a3; font-size:9px; margin-top:8px; }
.kicker { color:#1da1ff; font-weight:700; letter-spacing:2px; font-size:11px; text-transform:uppercase; }
.tier-gruen td:first-child { box-shadow: inset 4px 0 0 #16a34a; }
.tier-gelb td:first-child { box-shadow: inset 4px 0 0 #f59e0b; }
.tier-rot td:first-child { box-shadow: inset 4px 0 0 #dc2626; }
.badge { font-size:9px; font-weight:700; white-space:nowrap; }
.b-gruen{color:#16a34a;} .b-gelb{color:#b45309;} .b-rot{color:#dc2626;}
ol.steps { margin:6px 0 0 18px; padding:0; } ol.steps li { margin-bottom:5px; }
</style></head><body>""")

# COVER
parts.append(f"""
<div class="cover">
<div class="kicker">Project X · Naming-Recherche · v2 (geprüft)</div>
<h1>Namens-Kandidaten</h1>
<p class="sub">Verfügbare &amp; web-geprüfte Domains für das Schul-Cockpit für ambitionierte Oberstufen-Schüler<br>Erstellt am 26.06.2026 für Nepomuk</p>
<div class="statbox">
  <div class="stat"><span class="n">2120</span><span class="l">Namen generiert &amp; auf Domains geprüft</span></div>
  <div class="stat"><span class="n">463</span><span class="l">.com UND .app frei</span></div>
  <div class="stat"><span class="n">33</span><span class="l">Top-Namen web-geprüft</span></div>
  <div class="stat"><span class="n">{n_gruen}</span><span class="l">grün empfohlen (sauber)</span></div>
</div>
<div class="note ok"><b>Neu in dieser Version:</b> Die 33 stärksten Kandidaten habe ich tatsächlich gegen bestehende Produkte, Firmen und Marken im Web geprüft (siehe Ampel-Tabelle). Ergebnis: Einige scheinbar perfekte Namen sind in Wahrheit belegt — z.&nbsp;B. war <b>zielpilot</b> ein direkter KI-Lerncoach-Konkurrent für Schüler, <b>lerngipfel</b> ein Bildungsverein, <b>notenhub</b> ein bestehender Notenrechner. Domains frei ≠ Name frei.</div>
<div class="note"><b>Was ich automatisiert prüfen konnte:</b> (1) <b>Domain .com &amp; .app</b> — hart verifiziert per offiziellem RDAP (Verisign + Google-Registry), Stand 26.06.2026. (2) <b>Produkt-/Marken-Präsenz im Web</b> — per echter Websuche, Ergebnis pro Name unten.</div>
<div class="note warn"><b>Was du vor der finalen Entscheidung noch selbst machen musst, Nepomuk</b> (lässt sich nicht zuverlässig automatisieren — Bot-Schutz):
<ol class="steps">
<li><b>DPMA-Markenregister</b> (rechtsverbindlich): kostenlos auf <b>register.dpma.de</b> → "Marken-Recherche" → deinen Wunschnamen + Klasse 9/41/42 (Software/Bildung) prüfen. Zusätzlich EU-Marken auf <b>tmview.org</b>.</li>
<li><b>Social-Handles schnappen</b>: Instagram, TikTok &amp; X gleichzeitig prüfen und sofort registrieren (auch wenn du sie erst später nutzt) — bei Instagram/TikTok zeigt der Login-Wall jeden Namen als "existiert", also manuell aufrufen.</li>
<li><b>Google-Vollcheck</b>: Wunschname + "App" / "Schule" / "Noten" googeln — habe ich für die Top 33 schon gemacht, bei deiner finalen Wahl nochmal selbst gegenlesen.</li>
</ol>
Erst danach Domain registrieren. Preise: .com ca. 10–12&nbsp;€/Jahr, .app ca. 12–16&nbsp;€/Jahr.</div>
</div>
""")

# GEPRÜFTE EMPFEHLUNG (Ampel)
for tier, titel, intro in [
  ("gruen","🟢 Grün — sauber &amp; empfohlen","Kein konkurrierendes Produkt/keine Marke gefunden. Domains frei. Das sind meine echten Favoriten."),
  ("gelb","🟡 Gelb — frei, aber mit Vorsicht","Domains frei, aber generischer Begriff, Nebenbedeutung oder ähnliche Marke. Nutzbar, aber vorher genau abwägen."),
  ("rot","🔴 Rot — würde ich abraten","Domains zwar frei, ABER ein bestehendes Produkt/eine Marke nutzt den Namen im ähnlichen Feld. Verwechslungs- &amp; Markenrisiko."),
]:
    rows = [v for v in vetted if v[1]==tier]
    if tier=="gruen":
        parts.append('<h2>Geprüfte Empfehlung — Ampel der Top 33</h2>')
    parts.append(f'<h3>{titel} <span style="color:#8b94a3;font-weight:400">({len(rows)})</span></h3>')
    parts.append(f'<p style="margin:2px 0 6px;color:#5b6472;font-size:10px">{intro}</p>')
    parts.append('<table><thead><tr><th style="width:14%">Name</th><th style="width:11%">Domains</th><th style="width:26%">Bedeutung</th><th>Web-Befund</th></tr></thead><tbody>')
    for name, t, bed, fund in rows:
        parts.append(f'<tr class="tier-{t}"><td class="name">{esc(name)}</td><td class="dom">.com ✓ .app ✓</td><td>{esc(bed)}</td><td>{esc(fund)}</td></tr>')
    parts.append('</tbody></table>')

# FULL LIST
parts.append('<h2 style="page-break-before:always;">Alle 463 Namen mit freien Domains — nach Kategorie</h2>')
parts.append('<p class="sub" style="margin-top:0">Jeder Name ist auf <b>.com</b> und <b>.app</b> frei (RDAP-verifiziert). Nur die oben gelisteten 33 sind zusätzlich web-geprüft — bei allen anderen den Web-/Marken-Check vor der Wahl selbst machen. Typ: Kompositum (zusammengesetzt) oder Kunstwort (erfunden).</p>')
for cat in order:
    rows = sorted(cats[cat], key=lambda r:r["name"])
    parts.append(f'<h3>{esc(cat)} <span style="color:#8b94a3;font-weight:400">({len(rows)})</span></h3>')
    parts.append('<table><thead><tr><th style="width:16%">Name</th><th style="width:13%">Domains</th><th style="width:13%">Typ</th><th>Bedeutung</th></tr></thead><tbody>')
    for r in rows:
        parts.append(f'<tr><td class="name">{esc(r["name"])}</td><td class="dom">.com ✓ .app ✓</td><td>{esc(r["typ"])}</td><td>{esc(r["bedeutung"])}</td></tr>')
    parts.append('</tbody></table>')

parts.append('<p class="foot" style="margin-top:20px">Generiert mit Claude Code · Domain-Check live per RDAP, Web-Check per Suche, am 26.06.2026 · Verfügbarkeit &amp; Marken können sich jederzeit ändern — vor Registrierung erneut prüfen. Dies ist keine Rechtsberatung.</p>')
parts.append('</body></html>')

with open(os.path.join(DIR, "namen.html"), "w") as f:
    f.write("\n".join(parts))
print("HTML geschrieben. Grün:", n_gruen, "| Geprüft:", len(vetted))
