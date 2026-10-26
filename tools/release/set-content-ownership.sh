#!/bin/bash
# Makes WordPress the owner of the Main Website's public content (or undoes it), with an automatic way back.
#
#   bash tools/release/set-content-ownership.sh <expected live deployment id>    on
#   bash tools/release/set-content-ownership.sh --undo <deployment id to restore> off
#
# What "on" means (lib/wordpress/contentOwnership.js, enforced in src/middleware.js before any sign-in check):
# the Main Website's own /admin can no longer WRITE content that WordPress now draws (pages, blogs, sections, SEO,
# menus, header/footer, …): such writes get 423 "managed in the WordPress Master Admin". Reading keeps working;
# leads (/api/cms/leads), users, uploads, LMS data and the tables behind pages that stay on Main (companies,
# internships, resources, blog authors/categories/tags) stay editable there. Visitors see no difference.
#
# In order (it stops at the first problem and leaves production as it was):
#   1. linked project acadvizen-newww-ua9d; www.acadvizen.com served by exactly <expected live deployment id>;
#      WORDPRESS_OWNS_PUBLIC_CONTENT not set yet;
#   2. records every Main address (control read twice; the two reads must match);
#   3. adds WORDPRESS_OWNS_PUBLIC_CONTENT=true for Production (not a secret; no other variable is read or
#      changed) and `vercel redeploy`s the live deployment for production (same commit, new setting);
#   4. checks: every address unchanged; Main /admin answers 200; an anonymous POST to /api/cms/pages gets 423
#      (refused before any sign-in, nothing is written); anonymous POSTs to companies / internships / resources /
#      authors / leads do NOT get 423. Any failure: promotes <expected live deployment id> back and removes the
#      variable.
# --undo promotes the given deployment and removes the variable. Prints no secret.
# Output: ~/acadvizen-release/ownership-<UTC time>/.
set -euo pipefail
cd "$(dirname "$0")/../.."
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'

PROJECT='acadvizen-newww-ua9d'
MAIN='https://www.acadvizen.com'
VAR='WORDPRESS_OWNS_PUBLIC_CONTENT'
OUT="$(cygpath -m "$HOME" 2>/dev/null || echo "$HOME")/acadvizen-release/ownership-$(date -u +%Y%m%dT%H%MZ)"; mkdir -p "$OUT"
log() { echo "[$(date -u +%H:%M:%SZ)] $*" | tee -a "$OUT/log.txt"; }

live_deployment() {
	npx --yes vercel inspect "$MAIN" > "$OUT/inspect.txt" 2>&1 || true
	grep -m1 -oE '\bid[[:space:]]+dpl_[A-Za-z0-9]+' "$OUT/inspect.txt" | grep -oE 'dpl_[A-Za-z0-9]+' || true
}
var_listed() {
	npx --yes vercel env ls production > "$OUT/env-ls.txt" 2>&1 || true
	grep -qE "^[[:space:]]*$VAR[[:space:]]" "$OUT/env-ls.txt"
}
remove_var() { printf 'y\n' | npx --yes vercel env rm "$VAR" production --yes >> "$OUT/env-rm.txt" 2>&1 || true; log "$VAR removed: $(var_listed && echo NO || echo yes)"; }
inventory() { node --no-warnings tools/main-route-inventory.mjs --main "$MAIN" --out "$OUT/$1.json" --text > "$OUT/inventory-$1.log" 2>&1; }
post_status() { curl -s -o "$OUT/probe.body" -w '%{http_code}' -X POST -H 'content-type: application/json' --data '{}' "$MAIN$1"; }

linked=$(node -e "console.log(require('./.vercel/project.json').projectName)")
[ "$linked" = "$PROJECT" ] || { log "STOP: this folder is linked to '$linked', not $PROJECT"; exit 1; }

if [ "${1:-}" = "--undo" ]; then
	BACK="${2:-}"
	[[ "$BACK" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "usage: set-content-ownership.sh --undo <deployment id to restore>"; exit 1; }
	log "promoting $BACK and removing $VAR"
	npx --yes vercel promote "$BACK" --yes > "$OUT/promote.txt" 2>&1 || log "promote reported an error (see promote.txt)"
	remove_var
	log "live now: $(live_deployment)"
	exit 0
fi

EXPECTED="${1:-}"
[[ "$EXPECTED" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "usage: set-content-ownership.sh <expected live deployment id> | --undo <id>"; exit 1; }
current=$(live_deployment)
[ "$current" = "$EXPECTED" ] || { log "STOP: www is served by '$current', expected $EXPECTED"; exit 1; }
if var_listed; then log "STOP: $VAR is already set for Production; nothing changed"; exit 1; fi
log "live: $current; $VAR not set"

# Before: the lock is off, so an anonymous POST to /api/cms/pages is refused by sign-in (not 423).
before_pages=$(post_status /api/cms/pages)
[ "$before_pages" != "423" ] || { log "STOP: /api/cms/pages already answers 423 before the change"; exit 1; }

log "recording every Main address (twice, as a control)..."
inventory before; inventory control
if ! node tools/main-migration-compare.mjs "$OUT/before.json" "$OUT/control.json" --md "$OUT/control.md" > "$OUT/control.txt" 2>&1; then
	log "STOP: the live site differs between two reads ($(tail -1 "$OUT/control.txt")). Nothing changed"; exit 1
fi
log "control: $(tail -1 "$OUT/control.txt")"

printf 'true' | npx --yes vercel env add "$VAR" production > "$OUT/env-add.txt" 2>&1 || true
var_listed || { log "STOP: $VAR could not be added (see env-add.txt); nothing deployed"; exit 1; }
log "$VAR=true added for Production"
if ! npx --yes vercel redeploy "$EXPECTED" --target production > "$OUT/redeploy.txt" 2>&1; then
	log "STOP: redeploy failed (see redeploy.txt)"; remove_var; exit 1
fi
now=''
for _ in $(seq 1 60); do now=$(live_deployment); [ -n "$now" ] && [ "$now" != "$EXPECTED" ] && break; sleep 10; done
[ -n "$now" ] && [ "$now" != "$EXPECTED" ] || { log "STOP: www still served by $EXPECTED"; remove_var; exit 1; }
log "live after redeploy: $now"

ok=1
inventory after
node tools/main-migration-compare.mjs "$OUT/before.json" "$OUT/after.json" --md "$OUT/compare.md" > "$OUT/compare.txt" 2>&1 || ok=0
log "every address: $(tail -1 "$OUT/compare.txt")"
admin=$(curl -s -o "$OUT/probe.body" -w '%{http_code}' "$MAIN/admin")
pages=$(post_status /api/cms/pages)
log "Main /admin: $admin | anonymous POST /api/cms/pages: $pages (expected 423)"
[ "$admin" = "200" ] && [ "$pages" = "423" ] || ok=0
for p in /api/cms/entities/companies /api/cms/entities/internships /api/cms/entities/resources /api/cms/entities/authors /api/cms/leads; do
	s=$(post_status "$p"); log "anonymous POST $p: $s (must not be 423)"; [ "$s" != "423" ] || ok=0
done
if [ "$ok" = 1 ]; then
	log "PASS: $VAR=true live on $now (was $EXPECTED). Way back: bash tools/release/set-content-ownership.sh --undo $EXPECTED"
else
	log "FAILED: going back to $EXPECTED"
	npx --yes vercel promote "$EXPECTED" --yes > "$OUT/promote.txt" 2>&1 || log "promote reported an error (see promote.txt)"
	remove_var
	log "live after rollback: $(live_deployment)"
	exit 1
fi
