#!/usr/bin/env bash
# Push the bot to the DigitalOcean droplet and restart it (decision 0004).
# Usage: sleep-log/deploy/deploy.sh [root@HOST]   (run from anywhere; needs SSH key access)
# First-time droplet setup (user, venv, swap, unit) is in sleep-log/README.md.
set -euo pipefail
HOST="${1:-root@165.245.190.59}"
cd "$(dirname "$0")/.."
rsync -a --exclude .venv --exclude .pytest_cache --exclude __pycache__ --exclude tests \
  --exclude '*.plist' --exclude deploy ./ "$HOST:/opt/sleep-log/"
scp -q deploy/sleep-log.service "$HOST:/etc/systemd/system/sleep-log.service"
ssh "$HOST" 'set -e; cd /opt/sleep-log
  chmod 600 .env service-account.json; chown -R sleeplog:sleeplog /opt/sleep-log
  sudo -u sleeplog .venv/bin/pip install -q -r requirements.txt
  systemctl daemon-reload; systemctl restart sleep-log; sleep 5
  systemctl is-active sleep-log; journalctl -u sleep-log --no-pager -n 5'
