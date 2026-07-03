#!/usr/bin/env python3
# v2: kurze+mittellange, brandbare Kunstwoerter aus echten Wurzeln (lat/gr/eng/de) + Fragment-Kombis
import csv, os, itertools
DIR = os.path.dirname(os.path.abspath(__file__))

# stamm -> (sprache, bedeutung)
roots = {
 # LATEIN
 "lumi":("lat","von 'lumen' = Licht, Leuchte"),"luc":("lat","von 'lux' = Licht"),
 "clar":("lat","von 'clarus' = klar, hell, berühmt"),"grad":("lat","von 'gradus' = Stufe, Grad, Note"),
 "nota":("lat","'nota' = Zeichen, Note"),"sapi":("lat","von 'sapere' = wissen, weise sein"),
 "meri":("lat","von 'meritum' = Verdienst, Leistung"),"vela":("lat","'vela' = Segel, volle Fahrt"),
 "nova":("lat","'nova' = neu, neuer Stern"),"cresc":("lat","von 'crescere' = wachsen"),
 "scand":("lat","von 'scandere' = emporsteigen"),"apex":("lat","'apex' = Spitze, Höhepunkt"),
 "culm":("lat","von 'culmen' = Gipfel"),"vert":("lat","von 'vertex' = Scheitel, höchster Punkt"),
 "summ":("lat","von 'summus' = der Höchste"),"studi":("lat","von 'studium' = Eifer, Lernen"),
 "schol":("lat","von 'schola' = Schule"),"mens":("lat","'mens' = Geist, Verstand"),
 "cogi":("lat","von 'cogitare' = denken"),"veri":("lat","von 'veritas' = Wahrheit"),
 "prim":("lat","von 'primus' = der Erste"),"opti":("lat","von 'optimus' = der Beste"),
 "acu":("lat","von 'acumen' = Scharfsinn"),"vigo":("lat","von 'vigor' = Tatkraft"),
 "sol":("lat","'sol' = Sonne, Energie"),"aura":("lat","'aura' = Hauch, Glanz"),
 "pol":("lat","von 'polus' = Pol, Drehpunkt"),"orbi":("lat","von 'orbis' = Bahn, Welt"),
 "faro":("lat","'pharus' = Leuchtturm, Orientierung"),"meta":("lat","'meta' = Ziel, Wendepunkt"),
 "via":("lat","'via' = Weg"),"iter":("lat","'iter' = Reise, Weg"),"arca":("lat","'arca' = Schatztruhe"),
 "doce":("lat","von 'docere' = lehren"),"disc":("lat","von 'discere' = lernen"),
 "memo":("lat","von 'memor' = Gedächtnis"),"cura":("lat","'cura' = Sorgfalt, Pflege"),
 "forti":("lat","von 'fortis' = stark, mutig"),"celer":("lat","'celer' = schnell"),
 "anima":("lat","'anima' = Seele, Antrieb"),"credo":("lat","'credo' = ich vertraue"),
 "astra":("lat","'ad astra' = zu den Sternen"),"stella":("lat","'stella' = Stern"),
 "lucid":("lat","von 'lucidus' = klar, leuchtend"),"penso":("lat","von 'pensum' = Pensum, Aufgabe"),
 # GRIECHISCH
 "soph":("gr","von 'sophia' = Weisheit"),"noe":("gr","von 'nous' = Geist, Einsicht"),
 "kosmo":("gr","'kosmos' = Welt, Ordnung"),"astro":("gr","'astron' = Stern"),
 "neo":("gr","'neos' = neu"),"dyna":("gr","'dynamis' = Kraft"),"chrono":("gr","'chronos' = Zeit"),
 "mnemo":("gr","'mneme' = Gedächtnis"),"gnosi":("gr","'gnosis' = Wissen, Erkenntnis"),
 "mathe":("gr","'mathema' = das Gelernte"),"telos":("gr","'telos' = das Ziel, der Zweck"),
 "arete":("gr","'arete' = Bestleistung, Tugend"),"logos":("gr","'logos' = Vernunft, Sinn"),
 "kineo":("gr","von 'kinein' = bewegen"),"phos":("gr","'phos' = Licht"),"eu":("gr","'eu' = gut, wohl"),
 "akme":("gr","'akme' = der Höhepunkt"),"paide":("gr","von 'paideia' = Bildung"),
 # ENGLISCH
 "peak":("eng","engl. 'peak' = Gipfel"),"rise":("eng","engl. 'rise' = Aufstieg"),
 "edge":("eng","engl. 'edge' = Vorsprung"),"core":("eng","engl. 'core' = Kern"),
 "mind":("eng","engl. 'mind' = Verstand"),"spark":("eng","engl. 'spark' = Funke"),
 "beam":("eng","engl. 'beam' = Strahl"),"north":("eng","engl. 'north' = Richtung"),
 "path":("eng","engl. 'path' = Pfad"),"sage":("eng","engl. 'sage' = der Weise"),
 "crest":("eng","engl. 'crest' = Spitze, Kamm"),"bloom":("eng","engl. 'bloom' = aufblühen"),
 "thrive":("eng","engl. 'thrive' = gedeihen"),"keen":("eng","engl. 'keen' = scharf, eifrig"),
 "swift":("eng","engl. 'swift' = schnell"),"prime":("eng","engl. 'prime' = erstklassig"),
 "scope":("eng","engl. 'scope' = Blickfeld"),"quest":("eng","engl. 'quest' = die Suche"),
 "grit":("eng","engl. 'grit' = Biss, Ausdauer"),"vivid":("eng","engl. 'vivid' = lebhaft, klar"),
 # DEUTSCH (umlautfrei)
 "klar":("de","dt. 'klar' = im Blick"),"gipf":("de","von 'Gipfel' = höchster Punkt"),
 "stufe":("de","dt. 'Stufe' = Niveau"),"kurs":("de","dt. 'Kurs' = Richtung"),
 "merk":("de","dt. 'merken' = einprägen"),"ziel":("de","dt. 'Ziel'"),
 "blick":("de","dt. 'Blick' = Überblick"),"reif":("de","dt. 'reif' = Reife, Matura"),
 "wissen":("de","dt. 'Wissen'"),"glanz":("de","dt. 'Glanz'"),"steil":("de","dt. 'steil' = Aufstieg"),
 "spur":("de","dt. 'Spur' = richtige Fährte"),"funke":("de","dt. 'Funke'"),
}

# brandbare Endungen (klingen wie echte Marken), je Sprache — nur wohlklingende
endings = {
 "lat": ["a","o","io","ia","eo","ar","ix","us","ora"],
 "gr":  ["a","o","io","ia","os","ix"],
 "eng": ["a","o","io","ia","ly","r","ix"],
 "de":  ["a","o","io","ia"],
}

def euphonic(name):
    if not (4 <= len(name) <= 11): return False
    # keine 3 gleichen/Vokal-Triple, keine 4 Konsonanten am Stück
    import re
    if re.search(r"[aeiou]{3}", name): return False
    if re.search(r"[^aeiou]{4}", name): return False
    return True

rows = {}
for stamm,(lang,bed) in roots.items():
    for e in endings[lang]:
        if stamm[-1] in "aeiou" and e[0] in "aeiou":  # Vokal-Kollision
            continue
        name = (stamm+e).lower()
        if euphonic(name):
            rows.setdefault(name,(lang,bed))

# Fragment-Kombis (halbes Wort + halbes Wort), nur euphonische
pre = {"lumi":"Licht","clar":"Klarheit","grad":"Stufe/Note","nota":"Note","sapi":"Wissen",
       "veri":"Wahrheit","nova":"Neues","astra":"Sterne","vela":"Segel","meri":"Verdienst",
       "soph":"Weisheit","neo":"Neu","kosmo":"Welt","alti":"Höhe","summi":"Gipfel","scho":"Schule"}
suf = {"lux":"Licht","via":"Weg","grad":"Stufe","mind":"Geist","core":"Kern","peak":"Gipfel",
       "rise":"Aufstieg","path":"Pfad","nova":"Neues","sol":"Sonne","aura":"Glanz","mens":"Geist",
       "via":"Weg","ria":"-","ora":"-","ize":"-"}
for p,pm in pre.items():
    for s,sm in suf.items():
        name=(p+s).lower()
        if name in rows: continue
        if p[-1] in "aeiou" and s[0] in "aeiou": continue
        if euphonic(name):
            mean = f"Fragment-Kombi: {pm}" + (f" + {sm}" if sm!="-" else "")
            rows.setdefault(name,("mix",mean))

# Handkuratierte Premium-Namen (eigene Bedeutung)
curated = [
 # -- Licht / Klarheit --
 ("lumira","lat","von 'lumen' = Licht — Klarheit über deinen Stand"),
 ("lumara","lat","von 'lumen' = Licht, Leuchte"),("lumeo","lat","von 'lumen' = leuchten"),
 ("luxio","lat","von 'lux' = Licht"),("luxara","lat","von 'lux' = Licht"),
 ("lucio","lat","von 'lucere' = leuchten"),("lucent","lat","'lucent' = sie leuchten, klar"),
 ("klaria","de","von 'klar' = Klarheit, alles im Blick"),("clareo","lat","von 'clarus' = hell werden"),
 ("clarem","lat","von 'clarus' = klar, hell"),("luminar","lat","'luminar' = Lichtquelle"),
 ("phario","gr","von 'pharos' = Leuchtturm, Orientierung"),("eluma","lat","von 'lumen' = erhellen"),
 ("soluma","lat","'sol'+'lumen' = Sonnenlicht"),
 # -- Noten / Grade / Punkte --
 ("notavi","lat","'notavi' = ich habe notiert"),("notara","mix","von 'nota' = Note, als Marke"),
 ("notello","mix","von 'nota' = Note, verspielt"),("notira","mix","von 'nota' = Note"),
 ("gradeo","lat","von 'gradus' = Stufe, Grad"),("gradvia","mix","'gradus'+'via' = der Weg der Noten"),
 ("notavia","mix","'nota'+'via' = der Notenweg"),("quindo","lat","von 'quindecim' = 15 (Bestnote)"),
 ("skora","mix","von 'score' = Punktestand"),("meritu","lat","von 'meritum' = Verdienst, Leistung"),
 # -- Aufstieg / Gipfel --
 ("ascela","mix","von 'ascendere' = aufsteigen"),("ascendo","lat","'ascendo' = ich steige auf"),
 ("scando","lat","'scando' = ich steige empor"),("scaleo","mix","von 'scale' = erklimmen"),
 ("apexo","mix","von 'apex' = Spitze"),("culmeo","lat","von 'culmen' = Gipfel"),
 ("summio","mix","von 'summus' = der Höchste"),("vertia","mix","von 'vertex' = höchster Punkt"),
 ("cresta","mix","von 'crest' = Kamm, Spitze"),("aspira","lat","von 'aspirare' = anstreben"),
 ("elevo","lat","'elevo' = ich hebe empor"),("altio","lat","von 'altus' = hoch, erhaben"),
 ("loftio","eng","von 'loft' = die Höhe"),("surga","mix","von 'surge' = Schub nach vorn"),
 ("steilo","de","von 'steil' = steiler Aufstieg"),("klimbo","eng","von 'climb' = erklimmen"),
 # -- Wissen / Geist --
 ("sapira","lat","von 'sapere' = wissen, weise"),("sapeo","lat","von 'sapere' = verstehen"),
 ("menta","lat","von 'mens' = Geist, Verstand"),("mentio","lat","von 'mens' = des Geistes"),
 ("cogita","lat","'cogita!' = denke!"),("sophos","gr","'sophos' = der Weise"),
 ("sophio","gr","von 'sophia' = Weisheit"),("noeo","gr","von 'noesis' = Einsicht"),
 ("gnosa","gr","von 'gnosis' = Erkenntnis"),("mathio","gr","von 'mathema' = das Gelernte"),
 ("ingenio","lat","von 'ingenium' = Talent, Begabung"),("cortexo","mix","von 'cortex' = Denk-Hirn"),
 ("memora","lat","von 'memor' = sich erinnern"),("eruda","lat","von 'eruditus' = gebildet"),
 # -- Ziel / Weg / Richtung --
 ("metar","mix","von 'meta' = Ziel, als Marke"),("teleo","gr","von 'telos' = das Ziel"),
 ("viato","lat","von 'viator' = der Reisende"),("viara","mix","von 'via' = der Weg"),
 ("itera","lat","von 'iter' = Reise, Schritt für Schritt"),("nordo","mix","von 'Nord' = feste Richtung"),
 ("kursa","de","von 'Kurs' = Richtung"),("skopo","gr","von 'scope' = Blickfeld, Ziel"),
 ("azimo","mix","von 'Azimut' = die Peilung zum Ziel"),("vektar","mix","von 'Vektor' = Richtung + Kraft"),
 # -- Antrieb / Wachstum / Energie --
 ("cresca","mix","von 'crescere' = wachsen"),("vigora","lat","von 'vigor' = Tatkraft"),
 ("ardeo","lat","'ardeo' = ich brenne (vor Eifer)"),("elano","mix","von 'élan' = Schwung"),
 ("animo","lat","von 'animus' = Mut, Geist, Antrieb"),("kineo","gr","von 'kinein' = bewegen"),
 ("impeto","lat","von 'impetus' = Schwung, Drang"),("volaro","lat","von 'volare' = fliegen"),
 ("sparka","mix","von 'spark' = der Funke"),("floro","lat","von 'florere' = blühen"),
 # -- Sterne / Premium / Zukunft --
 ("astrio","gr","von 'astron' = Stern"),("astara","mix","von 'astra' = Sterne"),
 ("stelio","lat","von 'stella' = Stern"),("novara","lat","von 'nova' = neu, neuer Stern"),
 ("novum","lat","'novum' = das Neue"),("polaro","mix","von 'polaris' = Polarstern"),
 ("kosmeo","gr","von 'kosmos' = Welt, Ordnung"),("orbio","lat","von 'orbis' = Bahn, Welt"),
 ("sirio","lat","von 'Sirius' = hellster Stern"),("zenita","mix","von 'Zenit' = höchster Punkt"),
 ("lyrae","lat","von 'Lyra' = Sternbild, Klang"),
 # -- Schule --
 ("skola","lat","von 'schola' = Schule"),("scholo","lat","von 'schola' = Schule"),
 ("skolar","mix","von 'scholar' = der Gelehrte"),("magio","lat","von 'magister' = Lehrer, Meister"),
 ("penso","lat","von 'pensum' = Aufgabe, Pensum"),("lyceo","lat","von 'lyceum' = höhere Schule"),
 ("abeo","mix","'Abi' + lat. 'eo' = ich gehe (zum Abschluss)"),("reifo","de","von 'reif' = Reife, Matura"),
 ("maturo","lat","von 'maturus' = reif (Matura)"),("currio","lat","von 'curriculum' = Lehrplan"),
 ("lecto","lat","von 'lectio' = Lektion, Lesung"),("doceo","lat","'doceo' = ich lehre"),
 ("studo","lat","von 'studium' = Lernen"),("klasso","de","von 'Klasse' = Jahrgang, Niveau"),
 # -- Fragment-Fusionen (halbes + halbes Wort) --
 ("claragrad","mix","'clarus'+'gradus' = klare Noten"),("notalux","mix","'nota'+'lux' = Licht auf deine Noten"),
 ("sapimind","mix","'sapere'+'mind' = wissender Verstand"),("veripath","mix","'veritas'+'path' = der wahre Weg"),
 ("novacrest","mix","'nova'+'crest' = neue Spitze"),("klarvia","mix","'klar'+'via' = der klare Weg"),
 ("solnova","mix","'sol'+'nova' = neue Sonne"),("lumipath","mix","'lumen'+'path' = der erleuchtete Pfad"),
 ("meritura","mix","'meritum' = die Leistung, als Marke"),("astramind","mix","'astra'+'mind' = Sternengeist"),
 ("gradlux","mix","'gradus'+'lux' = Noten + Licht"),("scolux","mix","'schola'+'lux' = Schule + Licht"),
 ("lumio","lat","von 'lumen' = Licht ins Notenchaos"),("lumia","lat","von 'lumen' = Licht, Leuchte"),
 ("claria","lat","von 'claritas' = Klarheit"),("clario","lat","von 'clarus' = klar, hell"),
 ("notea","mix","'nota' (Note) als klare Marke"),("notavi","lat","'notavi' = ich habe notiert"),
 ("gradia","mix","von 'gradus' = Stufen, Grade"),("gradus","lat","'gradus' = Schritt, Stufe, Grad"),
 ("merita","lat","'merita' = die Verdienste"),("sapia","lat","von 'sapientia' = Weisheit"),
 ("sapio","lat","'sapio' = ich verstehe"),("studia","lat","'studia' = das Lernen"),
 ("velar","mix","'vela' (Segel) — volle Fahrt"),("vela","lat","'vela' = die Segel"),
 ("metar","mix","'meta' (Ziel) als Marke"),("orbita","lat","'orbita' = die Bahn, alles im Blick"),
 ("kresko","mix","von 'crescere' = wachsen"),("apexa","mix","'apex' (Spitze) als Marke"),
 ("verta","mix","von 'vertex' = höchster Punkt"),("summa","lat","'summa' = das Ganze, der Schnitt"),
 ("primus","lat","'primus' = der Erste, Klassenbeste"),("optima","lat","'optima' = die Beste"),
 ("magna","lat","'magna cum laude' = mit grossem Lob"),("acumen","lat","'acumen' = Scharfsinn"),
 ("ingenia","lat","'ingenium' = Talent, Begabung"),("claritas","lat","'claritas' = Klarheit"),
 ("vivace","mix","ital. 'vivace' = lebhaft, mit Schwung"),("brio","mix","ital. 'brio' = Schwung, Feuer"),
 ("polaris","lat","'stella polaris' = der Polarstern"),("astra","lat","'ad astra' = zu den Sternen"),
 ("stellar","eng","'stellar' = herausragend"),("solara","mix","'sol' = Sonne, Energie"),
 ("aurea","lat","'aurea' = golden, die goldene Mitte"),("faro","lat","'pharus' = Leuchtturm"),
 ("portus","lat","'portus' = sicherer Hafen"),("nimbo","lat","von 'nimbus' = Glorienschein"),
 ("sophia","gr","'sophia' = Weisheit"),("sophos","gr","'sophos' = der Weise"),
 ("noeo","gr","von 'noesis' = Einsicht, Denken"),("kosmo","gr","'kosmos' = dein Schul-Universum"),
 ("telos","gr","'telos' = das Ziel, der Zweck"),("areta","gr","von 'arete' = Bestleistung"),
 ("akmeo","gr","von 'akme' = der Höhepunkt"),("eudia","gr","'eudia' = heiteres, klares Wetter"),
 ("paidea","gr","'paideia' = Bildung, Erziehung"),("mathea","gr","von 'mathema' = das Gelernte"),
 ("mnemo","gr","'mneme' = Gedächtnis"),("gnosa","gr","von 'gnosis' = Erkenntnis"),
 ("reifo","de","von 'reif' = Reife, Abitur-Reife"),("abeo","mix","'Abi' + lat. 'eo' = ich gehe (zum Abschluss)"),
 ("scholar","eng","'scholar' = der Gelehrte"),("alumni","lat","'alumni' = die Schüler"),
 ("magi","lat","von 'magister' = Meister, Lehrer"),("pensa","lat","'pensa' = die Aufgaben"),
 ("lyceo","lat","von 'lyceum' = höhere Schule"),("mentis","lat","'mentis' = des Geistes"),
 ("cogita","lat","'cogita!' = denke!"),("memora","lat","von 'memor' = erinnern"),
 ("steilo","de","von 'steil' = der steile Aufstieg"),("gipfo","de","von 'Gipfel', frech gekürzt"),
 ("merka","de","von 'merken' = einprägen"),("blicco","mix","von 'Blick' = der Überblick"),
 ("kursa","de","von 'Kurs' = die Richtung"),("nordo","mix","von 'Nord' = feste Richtung"),
 ("zenith","eng","'zenith' = der Höhepunkt"),("zenit","de","'Zenit' = höchster Punkt"),
 ("vantage","eng","'vantage' = guter Aussichtspunkt"),("ascent","eng","'ascent' = der Aufstieg"),
 ("ascela","mix","von 'ascendere' = aufsteigen"),("crescent","eng","'crescent' = wachsend, zunehmend"),
 ("apexly","eng","'apex' (Spitze) + Marke"),("peakly","eng","'peak' (Gipfel) + Marke"),
 ("keenly","eng","'keen' (scharf/eifrig) + Marke"),("brightly","eng","'bright' (hell/klug) + Marke"),
 ("vela","lat","'vela' = volle Segel"),("luxa","lat","von 'lux' = Licht"),
 ("scala","lat","'scala' = Leiter, Treppe — die Notenskala & der Aufstieg"),
 ("scando","lat","'scando' = ich steige empor"),("ascendo","lat","'ascendo' = ich steige auf"),
]
for name,lang,bed in curated:
    rows.setdefault(name.lower(),(lang,bed))

with open(os.path.join(DIR,"pool2.tsv"),"w") as f:
    w=csv.writer(f,delimiter="\t"); w.writerow(["name","sprache","bedeutung"])
    for n in sorted(rows):
        w.writerow([n,rows[n][0],rows[n][1]])

from collections import Counter
c=Counter(v[0] for v in rows.values())
print("Pool2-Groesse:",len(rows),"| Sprachen:",dict(c))
