#!/usr/bin/env bash
DIR="$(dirname "$0")"
FREE="$DIR/com_free.txt"
RAW="$DIR/app_raw.tsv"
BOTH="$DIR/both_free.txt"

check_app() {
  n="$1"
  for try in 1 2 3 4 5; do
    c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://pubapi.registry.google/rdap/domain/${n}.app")
    if [ "$c" != "429" ] && [ "$c" != "000" ]; then
      echo -e "${n}\t${c}"
      return
    fi
    sleep $((try))   # backoff: 1s,2s,3s,4s,5s
  done
  echo -e "${n}\t${c}"
}
export -f check_app

# P=2 mit kleinem Versatz, Retry faengt 429 ab
cat "$FREE" | xargs -P 2 -I {} bash -c 'check_app "$@"' _ {} > "$RAW"

awk -F'\t' '$2==404 {print $1}' "$RAW" | sort > "$BOTH"
echo "App geprueft: $(wc -l < "$RAW" | tr -d ' ')"
echo "App Codes:"; cut -f2 "$RAW" | sort | uniq -c | sort -rn
echo "=== BEIDE FREI (.com UND .app): $(wc -l < "$BOTH" | tr -d ' ') ==="