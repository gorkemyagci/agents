# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-30

First public release.

### Added

- Terminal chat agent with approval before every tool call, file, shell, code-execution and web-search tools, token-usage display, and conversation compaction.
- Unit tests (vitest), Biome linting and formatting, and GitHub Actions CI.
- README, contributing guide, code of conduct, security policy, and issue and pull request templates.
- `.env.example` documenting the environment variables.

### Changed

- The package and command are named `agents`.
- Requires Node.js 22.12 or later.
- `executeCode` runs code from a private temporary directory and starts the interpreter without a shell.
- The Laminar API key is read from `LMNR_PROJECT_API_KEY` everywhere.
- Single-turn evals use the agent's real tool definitions, and the multi-turn dataset uses the real `runCommand` tool name. **Eval results from before this change are not comparable with current results.**
- Upgraded `@lmnr-ai/lmnr` to 0.8 and other dependencies to clear known advisories.

### Fixed

- Conversation compaction no longer drops the system prompt and the message that triggered it.
- Rejecting a tool call no longer leaves tool calls without results in the conversation history; the model is told the call was denied.
- Errors from the model stream are shown to the user instead of being hidden or replaced with a generic message, and no longer print over the terminal UI.
- Results of parallel calls to the same tool are matched to the right call in the UI.
- Terminal control sequences in model output and tool results are stripped before display.
- Typos in tool descriptions and messages.

[Unreleased]: https://github.com/gorkemyagci/agents/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gorkemyagci/agents/releases/tag/v0.1.0
