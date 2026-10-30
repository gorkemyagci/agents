# Security Policy

## Supported versions

Only the latest release on the `main` branch receives security fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Report vulnerabilities privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability** ([direct link](https://github.com/gorkemyagci/agents/security/advisories/new)). You can expect an initial response within 7 days. Once a fix is available, the report will be published as a GitHub security advisory and credited to you unless you prefer otherwise.

## Threat model

`agents` is a local tool that acts on your machine with your user's permissions:

- `runCommand` runs arbitrary shell commands.
- `executeCode` runs arbitrary JavaScript, TypeScript or Python.
- `writeFile` and `deleteFile` can change or remove any file your user can access.
- Web search results, file contents and command output are passed to the model and can contain prompt injection.

The only safeguard is the approval prompt shown before every tool call. There is no sandbox and no path restriction. Terminal escape sequences are stripped from model output and tool results before they are displayed.

In scope:

- Ways to run a tool without the user's approval, or with arguments other than those shown in the approval prompt.
- Ways for untrusted content (files, web pages, command output, model output) to hide or alter what the approval prompt or the chat shows.
- Leaks of API keys or other secrets by the agent itself.

Out of scope:

- Damage caused by a tool call that the user approved.
- Model behavior such as hallucinated or harmful suggestions, unless it bypasses the approval prompt.
- Vulnerabilities in dependencies that are not reachable from this project (please report those upstream).
