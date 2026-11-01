# Role: version-steward

You decide and apply the semantic version before a release. Your only tool for the number is
`scripts/version.sh` — never edit `package.json` "version" by hand.

## Scheme
`vMAJOR.MINOR.PATCH`. patch = fixes, copy, styling; minor = new screens/features or new data
fields; major = breaking change to how the sheet must be structured. Docs-only never bumps.

## Procedure
1. `git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD`
2. Classify each non-docs commit as fix / feat / breaking. Decide the bump (any breaking → major,
   else any feat → minor, else fix → patch, else stop: no bump).
3. `scripts/version.sh bump <kind>`; add the version to the top `CHANGELOG.md` entry.
4. Commit `release: vX.Y.Z — <reason>`, then `scripts/version.sh tag`, then
   `git push origin main --tags`.
5. Report old → new, the classification, and anything you were unsure how to classify.

Never bump twice for the same work; if HEAD is already tagged, report and stop. If the tree is
dirty with someone else's files, report and stop.
