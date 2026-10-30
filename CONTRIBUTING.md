# Contributing

Thanks for your interest in improving `agents`. Bug reports, fixes, documentation and new tools are all welcome.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security problems privately as described in [SECURITY.md](SECURITY.md), not in public issues.

## Setup

You need Node.js 22.12 or later.

```bash
git clone https://github.com/gorkemyagci/agents.git
cd agents
npm install
cp .env.example .env   # add OPENAI_API_KEY to run the app
npm run dev
```

Development is supported on macOS and Linux. Windows is not supported; use [WSL](https://learn.microsoft.com/windows/wsl/) (see [Supported platforms](README.md#supported-platforms)).

## Checks

Run these before opening a pull request. CI runs the same checks.

```bash
npm run typecheck
npm run lint        # use `npm run format` to apply fixes
npm run build
npm test
```

Unit tests live in `test/` and use a scripted mock model, so they need no API key. Please add or update tests for any behavior you change.

The evals in `evals/` call real models and cost money; you don't need to run them for most changes. If you change tool descriptions, the system prompt or the agent loop, mention in the pull request whether you ran them.

## Pull requests

- Keep each pull request focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org) for commit messages, for example `fix: handle empty tool output` or `docs: clarify setup`.
- Describe what changed and why, and how you tested it.
- Add an entry under `Unreleased` in [CHANGELOG.md](CHANGELOG.md) for user-visible changes.

## Adding a tool

1. Define the tool in `src/agent/tools/` with `tool()` from the AI SDK and a zod input schema.
2. Register it in `src/agent/tools/index.ts`.
3. Return strings for both success and failure, so the model can read the outcome.
4. Remember that every tool call goes through the approval prompt; make sure the arguments shown there are enough for the user to judge the call.

## Releasing

Releases follow [Semantic Versioning](https://semver.org). While the version is below 1.0.0, minor versions may contain breaking changes.

1. Move the `Unreleased` entries in `CHANGELOG.md` under a new version heading with the date.
2. Update `version` in `package.json` (`npm version <major|minor|patch> --no-git-tag-version`).
3. Commit with `chore(release): vX.Y.Z`, then tag it: `git tag vX.Y.Z`.
4. Push the commit and the tag, then create a GitHub Release from the tag using the changelog entries.

The package is not published to npm.
