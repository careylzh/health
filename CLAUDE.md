# CLAUDE.md

@AGENTS.md

## Claude Code specifics
- `AGENTS.md` (imported above) is the single source of truth. Put shared rules there, not here.
- Subagents in `.claude/agents/` are thin wrappers around `agents/roles/*.md`. Edit the role
  file, not the wrapper.
- Temporary scripts, screenshots and scratch builds go in the session scratchpad, never the repo.
- Use the browser tools (or a screenshot) at 375 px width to verify UI changes before claiming them.
