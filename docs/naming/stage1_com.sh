#!/usr/bin/env bash
DIR="$(dirname "$0")"
POOL="$DIR/pool.txt"
RAW="$DIR/com_raw.tsv"
FREE="$DIR/com_free.txt"

check_com() {
  n="$1"
  c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://rdap.verisign.com/com/v1/domain/${n}.com")
  echo -e "${n}\t${c}"
}
export -f check_com

cat "$POOL" | xargs -P 8 -I {} bash -c 'check_com "$@"' _ {} > "$RAW"
awk -F'\t' '$2==404 {print $1}' "$RAW" | sort > "$FREE"

echo "Geprueft: $(wc -l < "$RAW" | tr -d ' ')"
echo "Code-Verteilung:"; cut -f2 "$RAW" | sort | uniq -c | sort -rn
echo ".com FREI: $(wc -l < "$FREE" | tr -d ' ')"