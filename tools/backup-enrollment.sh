#!/bin/bash
# Complete backup of the production Enrollment WordPress (enroll.acadvizen.com): database + all files.
#
#   bash tools/backup-enrollment.sh
#
# READ-ONLY on the server: `wp db export` and `tar` write to standard output, which is streamed to this
# computer. Nothing is written, changed or deleted on the server, and no server disk space is used.
# Output: ~/acadvizen-backups/enroll-<UTC time>/ (enroll-db.sql.gz, enroll-files.tar.gz, server-facts.txt,
# SHA256SUMS, verify.txt). The backup holds customer data and wp-config.php: keep that folder private.
#
# SSH details come from ~/.acadvizen-production.env (SSH_HOST, SSH_PORT, SSH_USER, and SSH_PRIVATE_KEY_PATH
# and/or SSH_PASS); nothing else in that file is read. The key is tried first (once its public half is added in
# hPanel > Advanced > SSH Access), then the password. The password is handed to each ssh call through a temporary
# askpass helper that reads it from that call's environment; it is never printed, logged or written to disk.
#
# Verification (verify.txt): both archives pass gzip -t; the dump ends with "Dump completed" and has as
# many tables as the server reports; the archive holds wp-config.php, wp-content/uploads and as many
# files as the server reported; then a test restore into a throwaway local MariaDB container (Docker,
# no network) compares table and post counts. The container is removed afterwards.
set -euo pipefail

ENV_FILE="${ACADVIZEN_PRODUCTION_ENV:-$HOME/.acadvizen-production.env}"
EXPECTED_HOME='https://enroll.acadvizen.com'

# Only the four SSH settings are read; nothing from the file is exported to other programs.
setting() {
	local v
	v=$(sed -n "s/^$1=//p" "$ENV_FILE" | tail -1 | tr -d '\r')
	v="${v#\"}"; v="${v%\"}"; v="${v#\'}"; v="${v%\'}"
	printf '%s' "$v"
}
SSH_HOST=$(setting SSH_HOST); SSH_PORT=$(setting SSH_PORT); SSH_USER=$(setting SSH_USER); SSH_PW=$(setting SSH_PASS)
SSH_KEY=$(setting SSH_PRIVATE_KEY_PATH); SSH_KEY="${SSH_KEY/#\~/$HOME}"; [ -f "$SSH_KEY" ] || SSH_KEY=''
for v in SSH_HOST SSH_PORT SSH_USER; do [ -n "${!v}" ] || { echo "$v is not set in $ENV_FILE"; exit 1; }; done
[ -n "$SSH_KEY$SSH_PW" ] || { echo "neither SSH_PRIVATE_KEY_PATH nor SSH_PASS is set in $ENV_FILE"; exit 1; }

TS=$(date -u +%Y%m%dT%H%MZ)
OUT="$HOME/acadvizen-backups/enroll-$TS"
mkdir -p "$OUT"; chmod 700 "$HOME/acadvizen-backups" "$OUT"
log() { echo "[$(date -u +%H:%M:%SZ)] $*" | tee -a "$OUT/verify.txt"; }

AP=$(mktemp -d); chmod 700 "$AP"
cleanup() { rm -rf "$AP"; docker rm -f acv-restore-check > /dev/null 2>&1 || true; }
trap cleanup EXIT
# The helper holds no secret: it prints the variable ssh is given for one call.
printf '#!/bin/sh\nprintf "%%s\\n" "$ACV_SSH_PASS"\n' > "$AP/askpass"; chmod 700 "$AP/askpass"
remote() {
	ACV_SSH_PASS="$SSH_PW" SSH_ASKPASS="$AP/askpass" SSH_ASKPASS_REQUIRE=force DISPLAY=none \
		ssh -p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=keyboard-interactive,password \
		-o ServerAliveInterval=30 -o LogLevel=ERROR "$SSH_USER@$SSH_HOST" "$@" < /dev/null
}
# Read-only WP-CLI calls: no plugins or theme are loaded, and WordPress's scheduled tasks are not started.
WPCLI='wp --skip-plugins --skip-themes --exec="if (!defined(\"DISABLE_WP_CRON\")) define(\"DISABLE_WP_CRON\", true);"'

# 1. Find enroll's WordPress and make sure it is the production Enrollment website.
WP=$(remote 'd=$HOME/domains/enroll.acadvizen.com/public_html; [ -f "$d/wp-config.php" ] && echo "$d"' | tr -d '\r' || true)
[[ "$WP" =~ ^/[A-Za-z0-9_./-]+/public_html$ ]] || { log "FAIL enroll WordPress not found on the server"; exit 1; }
SITE=$(remote "cd '$WP' && $WPCLI option get home" | tr -d '\r')
[ "$SITE" = "$EXPECTED_HOME" ] || { log "FAIL unexpected site: $SITE"; exit 1; }
log "site $SITE"

# 2. Server facts (counts and sizes only). The output is parsed, never executed.
remote "cd '$WP' && p=\$($WPCLI db prefix) && echo prefix=\$p \
	&& echo tables=\$($WPCLI db tables --all-tables | wc -l) \
	&& echo posts=\$($WPCLI db query \"SELECT COUNT(*) FROM \${p}posts\" --skip-column-names) \
	&& echo db_bytes=\$($WPCLI db size --size_format=b) \
	&& echo files=\$(find . -type f | wc -l) \
	&& echo bytes=\$(du -sb . | cut -f1) \
	&& echo wordpress=\$($WPCLI core version)" | tr -d '\r' > "$OUT/server-facts.txt"
fact() { sed -n "s/^$1=//p" "$OUT/server-facts.txt" | tail -1; }
prefix=$(fact prefix); tables=$(fact tables); posts=$(fact posts); db_bytes=$(fact db_bytes)
files=$(fact files); bytes=$(fact bytes); wordpress=$(fact wordpress)
for n in tables posts db_bytes files bytes; do [[ "${!n}" =~ ^[0-9]+$ ]] || { log "FAIL server fact '$n' is not a number"; exit 1; }; done
[[ "$prefix" =~ ^[A-Za-z0-9_]+$ ]] || { log "FAIL unexpected table prefix"; exit 1; }
log "server: $tables tables, $posts posts rows, database $db_bytes bytes, $files files, $bytes bytes, WordPress $wordpress"

# 3. Database: every table, one consistent snapshot (InnoDB). Completeness is checked below.
log "database export..."
remote "cd '$WP' && $WPCLI db export - --single-transaction --quick --default-character-set=utf8mb4 | gzip -c" \
	> "$OUT/enroll-db.sql.gz" || log "database export ended with an error (checked below)"
log "database: $(wc -c < "$OUT/enroll-db.sql.gz") bytes compressed"

# 4. Every file of the site (WordPress, wp-content, uploads, wp-config.php, .htaccess). tar exits 1 when
#    a file changes while it is read, which is normal on a live site; completeness is checked below.
log "files archive..."
remote "tar -czf - -C '$(dirname "$WP")' '$(basename "$WP")' 2> /dev/null" \
	> "$OUT/enroll-files.tar.gz" || log "tar reported changed files (checked below)"
log "files: $(wc -c < "$OUT/enroll-files.tar.gz") bytes compressed"

( cd "$OUT" && sha256sum enroll-db.sql.gz enroll-files.tar.gz > SHA256SUMS )

# 5. Verify.
ok=1
check() { if [ "$2" = 1 ]; then log "PASS $1"; else log "FAIL $1"; ok=0; fi; }
yes_if() { if "$@"; then echo 1; else echo 0; fi; }
check "database archive is a complete gzip" "$(yes_if gzip -t "$OUT/enroll-db.sql.gz")"
check "files archive is a complete gzip" "$(yes_if gzip -t "$OUT/enroll-files.tar.gz")"
zcat "$OUT/enroll-db.sql.gz" > "$AP/dump.sql" || true
dump_tables=$(grep -c '^CREATE TABLE' "$AP/dump.sql" || true)
check "dump has all $tables tables (found $dump_tables)" "$(yes_if [ "$dump_tables" = "$tables" ])"
check "dump ends with 'Dump completed'" "$(yes_if grep -q 'Dump completed' <(tail -n 3 "$AP/dump.sql"))"
tar -tvzf "$OUT/enroll-files.tar.gz" > "$AP/list.txt" 2> /dev/null || true
archived=$(grep -c '^-' "$AP/list.txt" || true)
check "archive holds the server's files (server $files, archive $archived)" "$(yes_if [ "$archived" -ge $((files * 999 / 1000)) ])"
check "archive holds wp-config.php" "$(yes_if grep -q 'public_html/wp-config.php$' "$AP/list.txt")"
check "archive holds wp-content/uploads" "$(yes_if grep -q 'public_html/wp-content/uploads/' "$AP/list.txt")"

# 6. Test restore of the database into a throwaway local MariaDB (no network, removed afterwards).
if command -v docker > /dev/null 2>&1; then
	log "test restore into a throwaway local MariaDB..."
	docker rm -f acv-restore-check > /dev/null 2>&1 || true
	docker run -d --name acv-restore-check --network none -e MARIADB_ROOT_PASSWORD=restore-check -e MARIADB_DATABASE=r mariadb:11 > /dev/null
	for _ in $(seq 1 90); do docker exec acv-restore-check mariadb -uroot -prestore-check -e 'SELECT 1' r > /dev/null 2>&1 && break; sleep 2; done
	docker exec -i acv-restore-check mariadb -uroot -prestore-check r < "$AP/dump.sql" || log "test restore reported an error"
	restored_tables=$(docker exec acv-restore-check mariadb -uroot -prestore-check -N -e 'SHOW TABLES' r | wc -l)
	restored_posts=$(docker exec acv-restore-check mariadb -uroot -prestore-check -N -e "SELECT COUNT(*) FROM ${prefix}posts" r || echo 0)
	check "test restore: $restored_tables of $tables tables" "$(yes_if [ "$restored_tables" = "$tables" ])"
	check "test restore: $restored_posts of $posts posts rows" "$(yes_if [ "$restored_posts" -ge "$posts" ])"
else
	log "NOT RUN test restore (Docker not available)"; ok=0
fi

if [ "$ok" = 1 ]; then log "BACKUP VERIFIED: $OUT"; else log "BACKUP NOT VERIFIED: see $OUT/verify.txt"; exit 1; fi
