#!/bin/bash
# Releases one reviewed Main Website build to production, with an automatic way back.
#
#   bash tools/release/release-main.sh <source deployment id>
#   bash tools/release/release-main.sh --undo
#
# <source> is the Vercel deployment Git built from the pushed, reviewed commit (a preview of project
# acadvizen-newww-ua9d). tools/release/main-release.json names expected_live: the production deployment
# that must be live now, which is also the rollback target, and expect_noindex: the addresses this release
# makes noindex on purpose (they then leave the sitemap).
#
# In order (it stops at the first problem and leaves production as it was):
#   1. checks the linked project, that www.acadvizen.com is served by exactly expected_live, and that
#      <source> is a Ready deployment of the project;
#   2. records every Main address from the live sitemap twice and compares the two reads: if the site
#      differs from itself, a later difference would mean nothing, so it stops before changing anything;
#   3. `vercel redeploy`s <source> for production (its own commit, built with production settings) and
#      waits until www is served by the new deployment;
#   4. records every address again. Every address must be unchanged, except those in expect_noindex: each must
#      answer 200 with a noindex robots tag, and be absent from the sitemap. On every page checked, the
#      title and canonical must be in the <head>. On any other difference, it promotes expected_live
#      back at once.
# --undo promotes expected_live (exact id). No environment variable is read or changed. Prints no secret.
# Output: ~/acadvizen-release/main-<UTC time>/.
set -euo pipefail
cd "$(dirname "$0")/../.."

PROJECT='acadvizen-newww-ua9d'
MAIN='https://www.acadvizen.com'
EXPECTED=$(node -e "console.log(require('./tools/release/main-release.json').expected_live || '')")
NOINDEX=$(node -e "console.log((require('./tools/release/main-release.json').expect_noindex || []).join(' '))")
OUT="$HOME/acadvizen-release/main-$(date -u +%Y%m%dT%H%MZ)"; mkdir -p "$OUT"
log() { echo "[$(date -u +%H:%M:%SZ)] $*" | tee -a "$OUT/log.txt"; }

[[ "$EXPECTED" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "expected_live is not a full deployment id"; exit 1; }
live_deployment() {
	npx --yes vercel inspect "$MAIN" > "$OUT/inspect.txt" 2>&1 || true
	grep -m1 -oE '\bid[[:space:]]+dpl_[A-Za-z0-9]+' "$OUT/inspect.txt" | grep -oE 'dpl_[A-Za-z0-9]+' || true
}
inventory() { node --no-warnings tools/main-route-inventory.mjs --main "$MAIN" --out "$OUT/$1.json" --text > "$OUT/inventory-$1.log" 2>&1; }
summary() { node -e "const j=require(process.argv[1]);console.log(j.total+' addresses, '+j.not_200+' not 200')" "$OUT/$1.json"; }
rollback() {
	log "going back to $EXPECTED"
	npx --yes vercel promote "$EXPECTED" --yes > "$OUT/promote.txt" 2>&1 || log "promote reported an error (see promote.txt)"
	log "live after rollback: $(live_deployment)"
}

linked=$(node -e "console.log(require('./.vercel/project.json').projectName)")
[ "$linked" = "$PROJECT" ] || { log "STOP: this folder is linked to '$linked', not $PROJECT"; exit 1; }

if [ "${1:-}" = "--undo" ]; then rollback; exit 0; fi

SOURCE="${1:-}"
[[ "$SOURCE" =~ ^dpl_[A-Za-z0-9]{24,}$ ]] || { echo "usage: release-main.sh <source deployment id dpl_...> | --undo"; exit 1; }
current=$(live_deployment)
[ "$current" = "$EXPECTED" ] || { log "STOP: www is served by '$current', expected $EXPECTED"; exit 1; }
npx --yes vercel inspect "$SOURCE" > "$OUT/inspect-source.txt" 2>&1 || true
grep -qE "name[[:space:]]+$PROJECT" "$OUT/inspect-source.txt" && grep -qE 'status[[:space:]]+● Ready' "$OUT/inspect-source.txt" || { log "STOP: $SOURCE is not a Ready deployment of $PROJECT"; exit 1; }
log "live: $current; source: $SOURCE ($(grep -E '^[[:space:]]+(url|created)' "$OUT/inspect-source.txt" | tr -s '\t ' ' ' | tr '\n' ';'))"

log "recording every Main address (twice, as a control)..."
inventory before; inventory control
log "before: $(summary before) | control: $(summary control)"
if ! node tools/main-migration-compare.mjs "$OUT/before.json" "$OUT/control.json" --md "$OUT/control.md" > "$OUT/control.txt" 2>&1; then
	log "STOP: the live site differs between two reads ($(tail -1 "$OUT/control.txt")); see control.md. Nothing changed"
	exit 1
fi
log "control: two reads identical ($(tail -1 "$OUT/control.txt"))"

log "redeploying $SOURCE to production (rollback target $EXPECTED)..."
npx --yes vercel redeploy "$SOURCE" --target production > "$OUT/redeploy.txt" 2>&1 || { log "STOP: redeploy failed (see redeploy.txt); production unchanged"; exit 1; }
now=''
for _ in $(seq 1 60); do now=$(live_deployment); [ -n "$now" ] && [ "$now" != "$EXPECTED" ] && break; sleep 10; done
[ -n "$now" ] && [ "$now" != "$EXPECTED" ] || { log "STOP: www still served by $EXPECTED"; exit 1; }
log "live after redeploy: $now ($(grep -E '^[[:space:]]+(name|target|status|url)' "$OUT/inspect.txt" | tr -s '\t ' ' ' | tr '\n' ';'))"

log "recording every Main address after the release..."
inventory after
log "after: $(summary after)"
# The intended changes leave the sitemap: compare every other address as before.
node -e "const j=require(process.argv[1]);const drop=new Set(process.argv[3].split(' ').filter(Boolean));j.rows=j.rows.filter(r=>!drop.has(r.path));j.total=j.rows.length;require('fs').writeFileSync(process.argv[2],JSON.stringify(j))" "$OUT/before.json" "$OUT/before-kept.json" "$NOINDEX"
ok=1
node tools/main-migration-compare.mjs "$OUT/before-kept.json" "$OUT/after.json" --md "$OUT/compare.md" > "$OUT/compare.txt" 2>&1 || ok=0
log "other addresses: $(tail -1 "$OUT/compare.txt")"
# The intended noindex addresses, the sitemap, and metadata placement (a browser-like visitor and Googlebot, 3 reads each).
node -e "
const MAIN='$MAIN', noindex=process.argv[1].split(' ').filter(Boolean), sample=['/','/about','/blog','/testimonials','/courses','/tools','/placement',...noindex];
const UAS={browser:'Mozilla/5.0 acadvizen-release-check',googlebot:'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'};
(async()=>{let bad=[];const sm=await (await fetch(MAIN+'/sitemap.xml')).text();
for(const p of noindex){const r=await fetch(MAIN+p);const h=await r.text();const head=h.split('</head>')[0];const robots=(head.match(/<meta name=\"robots\" content=\"([^\"]*)\"/)||[])[1]||'';
 if(r.status!==200||!/noindex/.test(robots))bad.push(p+' status '+r.status+' robots '+robots); if(sm.includes(MAIN+p+'<')||sm.includes(MAIN.replace('www.','')+p+'<'))bad.push(p+' still in sitemap')}
for(const p of sample)for(const [n,ua] of Object.entries(UAS))for(let i=0;i<3;i++){const h=await (await fetch(MAIN+p,{headers:{'User-Agent':ua}})).text();const head=h.split('</head>')[0];if(!/<title>/.test(head)||!/rel=\"canonical\"/.test(head))bad.push(p+' '+n+' metadata not in <head>')}
console.log(bad.length?'FAIL '+bad.join(' | '):'PASS intended noindex addresses ('+noindex.length+'), sitemap, metadata in <head> ('+sample.length+' pages x 2 visitors x 3)');process.exit(bad.length?1:0)})()" "$NOINDEX" > "$OUT/intended.txt" 2>&1 || ok=0
log "intended changes: $(cat "$OUT/intended.txt")"
if [ "$ok" = 1 ]; then
	log "PASS: release live on $now (was $EXPECTED). Way back: bash tools/release/release-main.sh --undo"
else
	log "DIFFERENCE found: see $OUT/compare.md and intended.txt"
	rollback
	exit 1
fi
