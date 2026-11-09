#!/usr/bin/env bash
# One-time setup, run by Carey on the Mac (decision 0007). It lets GitHub Actions deploy the bot:
#   1. installs remote-deploy.sh on the droplet as /usr/local/bin/sleep-log-deploy
#   2. creates a new SSH key that can run only that script (no shell, no port forwarding)
#   3. stores the private key as the GitHub secret SLEEP_LOG_DEPLOY_KEY and deletes the local copy
# Undo: remove the line ending in github-actions-sleep-log-deploy from the droplet's
#       /root/.ssh/authorized_keys, then run: gh secret delete SLEEP_LOG_DEPLOY_KEY
set -euo pipefail
HOST="${1:-root@165.245.190.59}"
NAME=github-actions-sleep-log-deploy
cd "$(dirname "$0")"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
scp -q remote-deploy.sh "$HOST:/usr/local/bin/sleep-log-deploy"
ssh "$HOST" 'chown root:root /usr/local/bin/sleep-log-deploy; chmod 755 /usr/local/bin/sleep-log-deploy'
if ssh "$HOST" "grep -q $NAME ~/.ssh/authorized_keys"; then
  echo "The droplet already has a $NAME key. Remove it first to make a new one." >&2
  exit 1
fi
ssh-keygen -q -t ed25519 -N '' -C "$NAME" -f "$TMP/key"
gh secret set SLEEP_LOG_DEPLOY_KEY --repo careylzh/health < "$TMP/key"
ssh "$HOST" "echo 'command=\"/usr/local/bin/sleep-log-deploy\",restrict $(cat "$TMP/key.pub")' >> ~/.ssh/authorized_keys"
echo "Done. GitHub Actions can now deploy the bot."
