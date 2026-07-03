#!/usr/bin/env bash
# Prueft .com (Verisign) und .app (Google) per direktem RDAP. 404=frei, 200=vergeben
TSV="$(dirname "$0")/kandidaten.tsv"
OUT="$(dirname "$0")/ergebnis.tsv"

check_one() {
  name="$1"
  com=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://rdap.verisign.com/com/v1/domain/${name}.com")
  app=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://pubapi.registry.google/rdap/domain/${name}.app")
  echo -e "${name}\t${com}\t${app}"
}
export -f check_one

tail -n +2 "$TSV" | cut -f1 | xargs -P 5 -I {} bash -c 'check_one "$@"' _ {} > "$OUT"

echo "=== FERTIG. Geprueft: $(wc -l < "$OUT") Namen ==="
echo "=== .com Codes ===" ; cut -f2 "$OUT" | sort | uniq -c
echo "=== .app Codes ===" ; cut -f3 "$OUT" | sort | uniq -c
echo "=== BEIDE FREI (404/404): ==="
awk -F'\t' '$2==404 && $3==404 {print $1}' "$OUT" | sort
echo "=== Anzahl beide frei: $(awk -F'\t' '$2==404 && $3==404' "$OUT" | wc -l | tr -d ' ') ==="