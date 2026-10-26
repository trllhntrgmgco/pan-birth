#!/usr/bin/env bash
# Pan-Birth v11 improvement 00 — freeze a checksummed baseline before any change.
#
#   ./00-snapshot-baseline.sh [ROOT] [LABEL]
#
# Copies all nine databases into baseline/<LABEL>/ and records sha256 for each.
# Re-run with --verify to confirm a snapshot is intact, or to see exactly which
# databases a later step touched.
#
#   ./00-snapshot-baseline.sh ~/pan-birth-lab pre-backfill
#   ./00-snapshot-baseline.sh ~/pan-birth-lab pre-backfill --verify

set -uo pipefail
ROOT="${1:-.}"
LABEL="${2:-baseline}"
VERIFY=0
for a in "$@"; do [ "$a" = "--verify" ] && VERIFY=1; done

DEST="$ROOT/baseline/$LABEL"
DBS=("$ROOT/pan_mind.db" "$ROOT/omni-truth.db" "$ROOT"/minds/*_mind.db)

if [ "$VERIFY" -eq 1 ]; then
  [ -f "$DEST/MANIFEST.sha256" ] || { echo "no snapshot at $DEST" >&2; exit 1; }
  echo "verifying $DEST"
  ( cd "$DEST" && sha256sum -c MANIFEST.sha256 ) || exit 1
  echo
  echo "drift in working tree vs this snapshot:"
  for db in "${DBS[@]}"; do
    b="$DEST/$(basename "$db")"
    [ -s "$db" ] && [ -f "$b" ] || continue
    if cmp -s "$db" "$b"; then echo "  unchanged  $(basename "$db")"
    else echo "  CHANGED    $(basename "$db")"; fi
  done
  exit 0
fi

mkdir -p "$DEST"
for db in "${DBS[@]}"; do
  [ -s "$db" ] || { echo "skip $(basename "$db") — missing or empty" >&2; continue; }
  cp "$db" "$DEST/"
done
( cd "$DEST" && sha256sum ./*.db > MANIFEST.sha256 )
echo "snapshot written to $DEST"
wc -l < "$DEST/MANIFEST.sha256" | xargs echo "databases captured:"
