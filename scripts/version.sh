#!/usr/bin/env bash
# Single source of truth for the app version (package.json). Used by the version-steward role.
#   scripts/version.sh current            → print vX.Y.Z
#   scripts/version.sh bump patch|minor|major
#   scripts/version.sh tag                → annotated tag vX.Y.Z on HEAD
set -euo pipefail
cd "$(dirname "$0")/.."
cur() { node -p "require('./package.json').version"; }
case "${1:-}" in
  current) echo "v$(cur)" ;;
  bump)
    kind="${2:?usage: bump patch|minor|major}"
    [[ "$kind" =~ ^(patch|minor|major)$ ]] || { echo "bad kind: $kind" >&2; exit 2; }
    npm version "$kind" --no-git-tag-version >/dev/null
    echo "v$(cur)" ;;
  tag)
    v="v$(cur)"
    git rev-parse -q --verify "refs/tags/$v" >/dev/null && { echo "tag $v exists" >&2; exit 1; }
    git tag -a "$v" -m "release $v"; echo "$v" ;;
  *) echo "usage: $0 current|bump <kind>|tag" >&2; exit 2 ;;
esac
