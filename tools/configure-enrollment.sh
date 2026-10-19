#!/bin/bash
# Turns on the Master Admin's publishing features on the production Enrollment WordPress and adds the
# server cron job, or undoes both.
#
#   bash tools/configure-enrollment.sh            show the current state only (read-only)
#   bash tools/configure-enrollment.sh --apply    copy wp-config.php and the crontab on the server, then
#                                                 set the four switches and add the cron line
#   bash tools/configure-enrollment.sh --undo     restore the copies made by the last --apply
#
# Changes, and nothing else:
#   wp-config.php  ACADVIZEN_CMS_RENDER_BRIDGE, _APPROVAL, _SITE_TEMPLATES, _SITEMAP_CLEANUP = true
#                  (set with `wp config set`, which edits only those lines)
#   crontab        * * * * * wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php
# Before changing anything, --apply copies wp-config.php to wp-config.php.acv-<UTC time> (same folder,
# same permissions) and the crontab to ~/.acv-crontab-<UTC time>; --undo puts those back.
# Turn the Main Website's reading of WordPress (WORDPRESS_CONTENT_ENABLED on Vercel) on first.
#
# SSH details come from ~/.acadvizen-production.env (SSH_HOST, SSH_PORT, SSH_USER, SSH_PASS) and are
# never printed; see tools/backup-enrollment.sh for how the password reaches ssh.
set -euo pipefail

MODE="${1:-}"
case "$MODE" in ''|--apply|--undo) ;; *) echo "usage: $0 [--apply|--undo]"; exit 2;; esac
ENV_FILE="${ACADVIZEN_PRODUCTION_ENV:-$HOME/.acadvizen-production.env}"
EXPECTED_HOME='https://enroll.acadvizen.com'
SWITCHES='ACADVIZEN_CMS_RENDER_BRIDGE ACADVIZEN_CMS_APPROVAL ACADVIZEN_CMS_SITE_TEMPLATES ACADVIZEN_CMS_SITEMAP_CLEANUP'
CRON_LINE='* * * * * wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php'

setting() {
	local v
	v=$(sed -n "s/^$1=//p" "$ENV_FILE" | tail -1 | tr -d '\r')
	v="${v#\"}"; v="${v%\"}"; v="${v#\'}"; v="${v%\'}"
	printf '%s' "$v"
}
SSH_HOST=$(setting SSH_HOST); SSH_PORT=$(setting SSH_PORT); SSH_USER=$(setting SSH_USER); SSH_PW=$(setting SSH_PASS)
for v in SSH_HOST SSH_PORT SSH_USER SSH_PW; do [ -n "${!v}" ] || { echo "$v is not set in $ENV_FILE"; exit 1; }; done

AP=$(mktemp -d); chmod 700 "$AP"; trap 'rm -rf "$AP"' EXIT
printf '#!/bin/sh\nprintf "%%s\\n" "$ACV_SSH_PASS"\n' > "$AP/askpass"; chmod 700 "$AP/askpass"
remote() {
	ACV_SSH_PASS="$SSH_PW" SSH_ASKPASS="$AP/askpass" SSH_ASKPASS_REQUIRE=force DISPLAY=none \
		ssh -p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=keyboard-interactive,password \
		-o ServerAliveInterval=30 -o LogLevel=ERROR "$SSH_USER@$SSH_HOST" "$@" < /dev/null
}
WPCLI='wp --skip-plugins --skip-themes'
log() { echo "[$(date -u +%H:%M:%SZ)] $*"; }

WP=$(remote 'd=$HOME/domains/enroll.acadvizen.com/public_html; [ -f "$d/wp-config.php" ] && echo "$d"' | tr -d '\r' || true)
[[ "$WP" =~ ^/[A-Za-z0-9_./-]+/public_html$ ]] || { log "enroll WordPress not found"; exit 1; }
SITE=$(remote "cd '$WP' && $WPCLI option get home" | tr -d '\r')
[ "$SITE" = "$EXPECTED_HOME" ] || { log "unexpected site: $SITE"; exit 1; }

state() {
	for c in $SWITCHES; do
		log "$c = $(remote "cd '$WP' && ($WPCLI config get $c --type=constant 2> /dev/null || echo '(not set)')" | tr -d '\r')"
	done
	log "server cron for wp-cron.php: $(remote 'crontab -l 2> /dev/null | grep -c "enroll.acadvizen.com/wp-cron.php" || true' | tr -d '\r') line(s)"
	log "copies on the server: $(remote "ls -1 '$WP'/wp-config.php.acv-* ~/.acv-crontab-* 2> /dev/null | wc -l" | tr -d '\r')"
}

case "$MODE" in
'')
	state
	;;
--apply)
	TS=$(date -u +%Y%m%dT%H%M%SZ)
	remote "cp -p '$WP/wp-config.php' '$WP/wp-config.php.acv-$TS' && (crontab -l 2> /dev/null || true) > ~/.acv-crontab-$TS"
	log "copied wp-config.php to wp-config.php.acv-$TS and the crontab to ~/.acv-crontab-$TS"
	for c in $SWITCHES; do
		remote "cd '$WP' && $WPCLI config set $c true --raw --type=constant --quiet"
	done
	remote "crontab -l 2> /dev/null | grep -qF 'enroll.acadvizen.com/wp-cron.php' || ( (crontab -l 2> /dev/null || true); echo '$CRON_LINE' ) | crontab -"
	remote "cd '$WP' && php -l wp-config.php > /dev/null" && log "wp-config.php syntax OK"
	state
	;;
--undo)
	LAST=$(remote "ls -1t '$WP'/wp-config.php.acv-* 2> /dev/null | head -1 | sed 's/.*wp-config.php.acv-//'" | tr -d '\r')
	[[ "$LAST" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || { log "no copy to restore"; exit 1; }
	remote "cp -p '$WP/wp-config.php.acv-$LAST' '$WP/wp-config.php' && { [ -f ~/.acv-crontab-$LAST ] && crontab ~/.acv-crontab-$LAST || true; }"
	log "restored wp-config.php and the crontab from $LAST"
	state
	;;
esac
