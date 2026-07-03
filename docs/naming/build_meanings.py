#!/usr/bin/env python3
import csv, os
DIR = os.path.dirname(os.path.abspath(__file__))

# Kuratierte Bedeutungen aus der ersten Kandidatenliste
curated = {}
with open(os.path.join(DIR, "kandidaten.tsv")) as f:
    r = csv.DictReader(f, delimiter="\t")
    for row in r:
        curated[row["name"]] = (row["kategorie"], row["bedeutung"])

pref = {
 'noten':('Noten','deine Noten'), 'schul':('Schule','dein Schulleben'),
 'lern':('Lernen','dein Lernen'), 'abi':('Abitur','dein Weg zum Abi'),
 'kurs':('Orientierung','dein Kurs'), 'punkt':('Noten','das 0-15-Punktesystem'),
 'ziel':('Ziel','dein Ziel'), 'fokus':('Fokus','dein Fokus'),
 'kopf':('Geist','dein Kopf'), 'plan':('Orientierung','dein Plan'),
 'takt':('Momentum','dein Rhythmus'), 'tag':('Werte','dein Schultag'),
 'grade':('Noten','deine Note (engl. grade)'), 'score':('Noten','dein Punktestand'),
 'study':('Lernen','dein Lernen (engl. study)'), 'scholar':('Lernen','der Gelehrte'),
 'campus':('Schule','dein Campus'), 'brain':('Geist','dein Gehirn'),
 'peak':('Aufstieg','der Gipfel'), 'rise':('Aufstieg','dein Aufstieg'),
 'ace':('Leistung','die Eins, das Ass'), 'north':('Orientierung','der Norden, die Richtung'),
 'prep':('Schule','die Vorbereitung'), 'ascend':('Aufstieg','aufsteigen'),
 'apex':('Aufstieg','die Spitze'), 'summit':('Aufstieg','der Gipfel'),
 'clar':('Klarheit','Klarheit'), 'lumen':('Klarheit','Licht'),
 'orbit':('Cockpit','die Umlaufbahn, alles im Blick'), 'nova':('Zukunft','ein neuer Stern'),
 'nexus':('Zukunft','der Knotenpunkt'), 'atlas':('Zukunft','der Traeger, Orientierung'),
 'vault':('Zukunft','der Tresor fuer deine Daten'), 'prime':('Leistung','erstklassig'),
 'edge':('Leistung','der Vorsprung'), 'forge':('Leistung','schmieden'),
 'momentum':('Momentum','der Schwung'), 'thrive':('Momentum','gedeihen'),
 'bloom':('Wachstum','aufbluehen'), 'kogni':('Geist','Kognition, Denken'),
 'mind':('Geist','der Verstand'), 'stella':('Sterne','der Stern'),
 'kosmos':('Sterne','der Kosmos'), 'polar':('Orientierung','der Polarstern'),
 'vega':('Sterne','ein heller Stern'), 'helio':('Sterne','die Sonne'),
 'mensa':('Geist','der Geist (lat. mens)'), 'schola':('Lernen','die Schule (lat.)'),
 'studio':('Lernen','der Lernort'), 'gradus':('Aufstieg','die Stufe (lat.)'),
 'level':('Aufstieg','die Stufe'), 'tier':('Aufstieg','die Stufe'),
 'merit':('Leistung','das Verdienst'), 'honor':('Leistung','die Ehre'),
 'laurel':('Leistung','der Lorbeer'), 'vita':('Werte','das Leben (lat.)'),
 'pulse':('Momentum','der Puls'), 'spark':('Werte','der Funke'),
 'vigor':('Werte','die Tatkraft'), 'elan':('Werte','der Schwung'),
 'arete':('Werte','die Bestleistung (gr. arete)'), 'kaizen':('Werte','staendige Verbesserung (jp.)'),
}
suf = {
 'flow':'im Flow, alles fliesst', 'pilot':'als Steuerung/Pilot', 'kompass':'als Kompass',
 'hub':'als zentraler Knotenpunkt', 'deck':'als Cockpit', 'board':'als Board/Tafel',
 'kit':'als Werkzeugkasten', 'loop':'als taegliche Routine', 'peak':'auf dem Gipfel',
 'base':'als Basis', 'core':'im Kern', 'desk':'als Schreibtisch', 'sync':'im Gleichtakt',
 'path':'als Pfad', 'way':'als Weg', 'scope':'im Blickfeld', 'sphere':'als eigene Sphaere',
 'verse':'als ganzes Universum', 'mind':'fuer den Kopf', 'boost':'als Schub',
 'os':'als Betriebssystem', 'lab':'als Labor', 'nest':'als Nest/Zuhause',
 'forge':'als Schmiede', 'rise':'im Aufstieg', 'grade':'rund um Noten',
 'score':'rund um den Punktestand', 'north':'als feste Richtung', 'star':'als Leitstern',
 'ly':'(moderne Marken-Endung)', 'io':'(Tech-Marken-Endung)', 'app':'(als App)',
}

def decompose(name):
    # laengsten passenden Praefix finden, Rest als Suffix pruefen
    best = None
    for p in sorted(pref, key=len, reverse=True):
        if name.startswith(p) and len(name) > len(p):
            rest = name[len(p):]
            if rest in suf:
                kat, pg = pref[p]
                bed = f"{pg.capitalize()} — {suf[rest]}"
                return kat, bed
            if best is None:
                best = (p, rest)
    return None

with open(os.path.join(DIR, "both_free.txt")) as f:
    names = [l.strip() for l in f if l.strip()]

rows = []
for n in names:
    if n in curated:
        kat, bed = curated[n]
        typ = "Kunstwort"
    else:
        d = decompose(n)
        if d:
            kat, bed = d
            typ = "Kompositum"
        else:
            kat, bed = ("Sonstige", "Kunstwort / abstrakte Marke")
            typ = "Kunstwort"
    rows.append((n, kat, typ, bed))

rows.sort(key=lambda r: (r[1], r[0]))
with open(os.path.join(DIR, "meanings.tsv"), "w") as out:
    w = csv.writer(out, delimiter="\t")
    w.writerow(["name","kategorie","typ","bedeutung"])
    w.writerows(rows)

from collections import Counter
c = Counter(r[1] for r in rows)
print("Gesamt:", len(rows))
for k,v in sorted(c.items(), key=lambda x:-x[1]):
    print(f"  {k}: {v}")
