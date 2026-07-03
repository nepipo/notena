#!/usr/bin/env bash
DIR="$(dirname "$0")"
POOL="$DIR/pool2.tsv"

check_com() {
  c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://rdap.verisign.com/com/v1/domain/$1.com")
  echo -e "$1\t$c"
}
export -f check_com
check_app() {
  for try in 1 2 3 4 5; do
    c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://pubapi.registry.google/rdap/domain/$1.app")
    if [ "$c" != "429" ] && [ "$c" != "000" ]; then echo -e "$1\t$c"; return; fi
    sleep $try
  done
  echo -e "$1\t$c"
}
export -f check_app

# Stage 1: .com (parallel, Verisign)
tail -n +2 "$POOL" | cut -f1 | xargs -P 8 -I {} bash -c 'check_com "$@"' _ {} > "$DIR/com2_raw.tsv"
awk -F'\t' '$2==404{print $1}' "$DIR/com2_raw.tsv" | sort > "$DIR/com2_free.txt"
echo "Stage1 .com: geprueft $(wc -l < "$DIR/com2_raw.tsv" | tr -d ' '), frei $(wc -l < "$DIR/com2_free.txt" | tr -d ' ')"

# Stage 2: .app auf die .com-Freien (langsam, Google)
cat "$DIR/com2_free.txt" | xargs -P 2 -I {} bash -c 'check_app "$@"' _ {} > "$DIR/app2_raw.tsv"
awk -F'\t' '$2==404{print $1}' "$DIR/app2_raw.tsv" | sort > "$DIR/both2_free.txt"
echo "Stage2 .app Codes:"; cut -f2 "$DIR/app2_raw.tsv" | sort | uniq -c
echo "=== BEIDE FREI: $(wc -l < "$DIR/both2_free.txt" | tr -d ' ') ==="