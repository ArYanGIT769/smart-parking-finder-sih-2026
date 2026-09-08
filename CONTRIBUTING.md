# Contributing to SPF

This repository is the team's working source for SIH 2026. Keep changes small, reviewable and tied to a real task.

## Suggested workflow

1. Create or claim a GitHub Issue.
2. Work on one focused change.
3. Run `npm run typecheck` and `npm run build` before pushing frontend changes.
4. Use descriptive commits, for example:
   - `feat: add parking event API`
   - `fix: prevent duplicate vehicle entry event`
   - `docs: update architecture for event pipeline`
   - `test: validate booking cancellation state`
5. Open a pull request for changes that affect shared architecture or multiple modules.

## Ground rules

- Do not commit secrets, API keys, credentials or `.env` files.
- Do not commit generated `node_modules` or `dist` folders.
- Do not backdate or fabricate commits.
- Label planned/in-progress features honestly.
- Keep SIH portal identifiers and team details exact once allotted.
