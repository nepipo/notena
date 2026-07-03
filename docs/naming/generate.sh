#!/usr/bin/env bash
# Generiert Komposita aus Praefix x Suffix + kuratierte Kunstwoerter
DIR="$(dirname "$0")"
OUT="$DIR/pool.txt"

# Deutsche + thematische Praefixe (Schule/Noten/Aufstieg/Founder)
prefixes=(noten schul lern abi kurs punkt ziel fokus kopf plan takt tag grade score study scholar campus brain peak rise ace north prep ascend apex summit clar lumen orbit nova nexus atlas vault prime edge forge momentum thrive bloom kogni mind stella kosmos polar vega helio mensa schola studio gradus level tier merit honor laurel vita pulse spark vigor elan arete kaizen)

# Suffixe / zweite Worthaelfte
suffixes=(flow pilot kompass hub deck board kit loop peak base core desk sync path way scope sphere verse mind boost os lab nest forge rise grade score north star ly io app)

> "$OUT"
for p in "${prefixes[@]}"; do
  for s in "${suffixes[@]}"; do
    # vermeide name == prefix doppelt mit gleichem suffixwort
    echo "${p}${s}" >> "$OUT"
  done
done

# Zusaetzliche kuratierte Kunstwoerter (aus erster Runde + neue)
cat >> "$OUT" <<'EOF'
gipfelo
notly
notara
quindo
quinta
gradia
skora
markio
aceon
acely
primella
edgio
forgeo
momenta
fluxo
thrivo
grovo
bloomo
sprouto
verda
kresco
augeo
novexo
nexora
futura
vantel
axio
atlaso
vaulta
verido
astera
astrio
stellara
kosmera
solara
mentis
kogni
noeto
studia
discio
skolar
lernio
pensa
kortex
synapt
neura
zentro
corely
kerno
hubly
campra
abira
maturo
arete
ikigai
animo
metae
telos
scopa
spektra
vidaro
sparka
ignis
voria
upvio
viator
itera
codexa
foliox
tabulo
sumara
omnia
mindra
laurea
honora
merita
valora
kineo
boosta
loftio
altura
vetta
crista
acme
quanta
indexa
ordo
morgo
ritmo
takta
pulsa
crefo
floro
fervo
clavo
levelo
tiero
passu
stepio
miloa
gradera
kalku
abaco
summa
avero
notenheld
notenpilotin
schulkosmos
lerngipfel
abiboost
abiready
abipath
notenpuls
schulpuls
lernpuls
abikompass
notenkonto
punktkonto
notencockpit
schulcockpit
abicockpit
lerncockpit
notenradar
schulradar
abiradar
notentracker
schulplaner
lernpfad
abipfad
notennord
schulnord
zielklar
notenklar
schulklar
abizeit
schulzeit
lernzeit
notenmeister
schulheld
lernheld
abiheld
EOF

# dedupe
sort -u "$OUT" -o "$OUT"
echo "Pool-Groesse: $(wc -l < "$OUT" | tr -d ' ')"