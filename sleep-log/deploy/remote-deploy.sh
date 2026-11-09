#!/usr/bin/env bash
# Runs on the droplet as /usr/local/bin/sleep-log-deploy (decision 0007). The GitHub Actions key can
# run only this script. It deploys the code on main, as the sleeplog user, and restarts the bot.
# It does not install the systemd unit, so a push cannot give itself root. Use deploy.sh for that.
# Actions logs are public on this repo: never print the journal or bot output here.
set -euo pipefail
APP=/opt/sleep-log
cd "$APP"
TMP=$(sudo -u sleeplog mktemp -d)
trap 'rm -rf "$TMP"' EXIT
sudo -u sleeplog git clone -q --depth 1 --branch main https://github.com/careylzh/health.git "$TMP/health"
sudo -u sleeplog rsync -a --exclude .env --exclude 'service-account*.json' --exclude .venv \
  --exclude tests --exclude deploy --exclude '*.plist' "$TMP/health/sleep-log/" "$APP/"
sudo -u sleeplog "$APP/.venv/bin/pip" install -q -r "$APP/requirements.txt"
systemctl restart sleep-log
sleep 5
systemctl is-active --quiet sleep-log || { echo "sleep-log is not running after restart" >&2; exit 1; }
echo "deployed $(sudo -u sleeplog git -C "$TMP/health" rev-parse --short HEAD)"
