#!/bin/bash
# Turns the Render Bridge on for the live Main Website (or back off), with an automatic way back.
#
#   bash tools/release/enable-bridge.sh          on:  WORDPRESS_CONTENT_ENABLED=true + redeploy of the live release
#   bash tools/release/enable-bridge.sh --undo   off: promote the previous deployment, remove the variable
#
# What "on" does, in order (it stops at the first problem and leaves production as it was):
#   1. checks the Vercel project is acadvizen-newww-ua9d and www.acadvizen.com is served by exactly
#      EXPECTED_DEPLOYMENT (default dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5);
#   2. records every Main address from the live sitemap twice (status, title, description, canonical,
#      robots, H1, visible text) and compares the two: if the site differs from itself between two reads,
#      a later difference would mean nothing, so it stops before changing anything;
#   3. adds WORDPRESS_CONTENT_ENABLED=true for Production (not a secret; no other variable is touched)
#      and checks it is listed, then `vercel redeploy`s the source deployment named in
#      tools/release/bridge-release.json for production (its own commit, built with production settings);
#   4. records every address again and compares with step 2. Any difference: promotes EXPECTED_DEPLOYMENT
#      back at once and removes the variable, so the site is as before.
# While WordPress publishes nothing to Main (empty manifest), every Main page stays the Next.js page, so
# the expected result is "no difference".
# --undo promotes EXPECTED_DEPLOYMENT (exact id) and removes the variable. Note: after a promote, Vercel
# stops moving the production domain to new Git deployments automatically until a deployment is promoted.
# Prints no secret. Output: ~/acadvizen-release/bridge-<UTC time>/.
set -euo pipefail
cd "$(dirname "$0")/../.."

PROJECT='acadvizen-newww-ua9d'
# tools/release/bridge-release.json: expected_live (must be live now; rollback target) and source (the
# deployment rebuilt for production; the live one itself when absent).
EXPECTED_DEPLOYMENT=$(node -e "console.log(require('./tools/release/bridge-release.json').expected_live || '')")
SOURCE_DEPLOYMENT=$(node -e "const j=require('./tools/release/bridge-release.json'); console.log(j.source || j.expected_live || '')")
VAR='WORDPRESS_CONTENT_ENABLED'
MAIN='https://www.acadvizen.com'
OUT="$HOME/acadvizen-release/bridge-$(date -u +%Y%m%dT%H%MZ)"; mkdir -p "$OUT"
log() { echo "[$(date -u +%H:%M:%SZ)] $*" | tee -a "$OUT/log.txt"; }

[[ "$EXPECTED_DEPLOYMENT" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "expected_live is not a full deployment id"; exit 1; }
[[ "$SOURCE_DEPLOYMENT" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "source is not a full deployment id"; exit 1; }
# Each lookup writes to a file first, so no pipeline can end the script half-way.
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
summary() { node -e "const j=require(process.argv[1]);console.log(j.total+' addresses, '+j.not_200+' not 200')" "$OUT/$1.json"; }

linked=$(node -e "console.log(require('./.vercel/project.json').projectName)")
[ "$linked" = "$PROJECT" ] || { log "STOP: this folder is linked to '$linked', not $PROJECT"; exit 1; }

if [ "${1:-}" = "--undo" ]; then
	log "promoting $EXPECTED_DEPLOYMENT back to production"
	npx --yes vercel promote "$EXPECTED_DEPLOYMENT" --yes > "$OUT/promote.txt" 2>&1 || log "promote reported an error (see promote.txt)"
	remove_var
	log "live deployment now: $(live_deployment)"
	exit 0
fi

current=$(live_deployment)
[ "$current" = "$EXPECTED_DEPLOYMENT" ] || { log "STOP: www is served by '$current', expected $EXPECTED_DEPLOYMENT"; exit 1; }
log "live: $current (project $PROJECT)"
if var_listed; then log "STOP: $VAR is already set for Production; nothing changed"; exit 1; fi

log "recording every Main address (twice, as a control)..."
inventory before; inventory control
log "before: $(summary before) | control: $(summary control)"
if ! node tools/main-migration-compare.mjs "$OUT/before.json" "$OUT/control.json" --md "$OUT/control.md" > "$OUT/control.txt" 2>&1; then
	log "STOP: the live site differs between two reads ($(tail -1 "$OUT/control.txt")); see control.md. Nothing changed"
	exit 1
fi
log "control: two reads identical ($(tail -1 "$OUT/control.txt"))"

printf 'true' | npx --yes vercel env add "$VAR" production > "$OUT/env-add.txt" 2>&1 || true
var_listed || { log "STOP: $VAR could not be added (see env-add.txt); nothing deployed"; exit 1; }
log "$VAR=true added for Production"

npx --yes vercel inspect "$SOURCE_DEPLOYMENT" > "$OUT/inspect-source.txt" 2>&1 || true
grep -qE "name[[:space:]]+$PROJECT" "$OUT/inspect-source.txt" && grep -qE 'status[[:space:]]+● Ready' "$OUT/inspect-source.txt" || { log "STOP: source $SOURCE_DEPLOYMENT is not a Ready deployment of $PROJECT"; remove_var; exit 1; }
log "redeploying $SOURCE_DEPLOYMENT to production (rollback target $EXPECTED_DEPLOYMENT)..."
if ! npx --yes vercel redeploy "$SOURCE_DEPLOYMENT" --target production > "$OUT/redeploy.txt" 2>&1; then
	log "STOP: redeploy failed (see redeploy.txt); production unchanged"; remove_var; exit 1
fi
now=''
for _ in $(seq 1 60); do now=$(live_deployment); [ -n "$now" ] && [ "$now" != "$EXPECTED_DEPLOYMENT" ] && break; sleep 10; done
[ -n "$now" ] && [ "$now" != "$EXPECTED_DEPLOYMENT" ] || { log "STOP: www still served by $EXPECTED_DEPLOYMENT"; remove_var; exit 1; }
log "live after redeploy: $now ($(grep -E '^[[:space:]]+(name|target|status)' "$OUT/inspect.txt" | tr -s '\t ' ' ' | tr '\n' ';'))"

log "recording every Main address after the change..."
inventory after
log "after: $(summary after)"
# The nine programmatic city pages that timed out on 16 Oct, all requested at once (60 s limit each).
node -e "
const P=['jp-nagar','koramangala','indiranagar','mg-road','rajajinagar','rr-nagar','hsr-layout','whitefield','marathahalli'].map(s=>'/digital-marketing-courses-'+s);
const hit=async p=>{const t0=Date.now();try{const r=await fetch('$MAIN'+p,{signal:AbortSignal.timeout(60000)});const h=await r.text();return {p,s:r.status,ms:Date.now()-t0,ok:r.status===200&&h.includes('</html>')}}catch(e){return {p,s:0,ms:Date.now()-t0,ok:false}}};
Promise.all(P.map(hit)).then(rs=>{console.log(rs.map(r=>r.p.replace('/digital-marketing-courses-','')+' '+r.s+'/'+r.ms+'ms').join(', '));process.exit(rs.every(r=>r.ok)?0:1)})" > "$OUT/city-pages.txt" 2>&1 && city=PASS || city=FAIL
log "city pages at once: $city ($(cat "$OUT/city-pages.txt"))"
if [ "$city" = PASS ] && node tools/main-migration-compare.mjs "$OUT/before.json" "$OUT/after.json" --md "$OUT/compare.md" > "$OUT/compare.txt" 2>&1; then
	log "PASS: every address unchanged ($(tail -1 "$OUT/compare.txt"))"
	log "bridge ON: $now (was $EXPECTED_DEPLOYMENT). Way back: bash tools/release/enable-bridge.sh --undo"
else
	log "DIFFERENCE found ($(tail -1 "$OUT/compare.txt")): going back to $EXPECTED_DEPLOYMENT"
	npx --yes vercel promote "$EXPECTED_DEPLOYMENT" --yes > "$OUT/promote.txt" 2>&1 || log "promote reported an error (see promote.txt)"
	remove_var
	log "live after rollback: $(live_deployment). See $OUT/compare.md"
	exit 1
fi
