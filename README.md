# agents

**A terminal AI agent that asks for your approval before every tool call.**

`agents` is a chat-based AI agent that runs in your terminal. It can read and write files, run shell commands, execute code and search the web, but it never acts on its own: each tool call is shown to you with its arguments, and nothing runs until you approve it. It is a small, readable TypeScript codebase (no agent framework) built on the [AI SDK](https://ai-sdk.dev) and [Ink](https://github.com/vadimdemedes/ink).

Started from Scott Moss's *Build an AI Agent from Scratch* course; extended with fixes for conversation compaction, rejected tool calls, stream error handling and tool-result tracking, terminal escape-sequence stripping, a safer code-execution tool, unit tests, CI, linting and project documentation.

<!-- Demo: add a GIF or screenshot of a session here -->

## Features

- **Human in the loop:** every tool call needs an explicit Yes/No in the terminal. Rejected calls are recorded in the conversation, so the model knows on the next turn.
- **Tools:** `readFile`, `writeFile`, `listFiles`, `deleteFile`, `runCommand` (shell), `executeCode` (JavaScript, TypeScript, Python) and OpenAI web search.
- **Streaming chat UI** built with Ink, with a token-usage indicator.
- **Context management:** estimates token usage and summarizes the conversation when it reaches 80% of the model's context window.
- **Tracing (optional)** with [Laminar](https://www.lmnr.ai).
- **Evals** for tool selection and multi-turn behavior.

## Requirements

- Node.js 20.10 or later (22.12 or later to run the test suite)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- Optional: Python 3 (for `executeCode` with Python), a Laminar project API key (for tracing and evals)

## Installation

```bash
git clone https://github.com/devgorkemyagci/agents.git
cd agents
npm install
cp .env.example .env   # then add your OpenAI API key
```

## Usage

```bash
npm run dev     # start with file watching
npm start       # start once
```

Type a request and press Enter. When the agent wants to use a tool, it shows the tool name and arguments; choose **Yes** or **No** with the arrow keys and press Enter. Type `exit` or `quit` to leave.

To install the `agents` command globally from your clone:

```bash
npm run build
npm link
agents
```

The `agents` command reads `OPENAI_API_KEY` (and optionally `LMNR_PROJECT_API_KEY`) from the environment.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Used by the agent (`gpt-5-mini`) and the evals. |
| `LMNR_PROJECT_API_KEY` | No | Enables Laminar tracing. Required to run the evals. |

`npm run dev` and `npm start` load these from `.env`.

## Security

This agent can modify files and run arbitrary commands and code on your machine with your user's permissions. The approval prompt is the only safeguard: there is no sandbox and no path restriction. Read each tool call before approving it, and do not run the agent in directories or on machines where a mistaken command would be costly. See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Architecture

```
src/cli.ts                 entry point: Laminar setup, renders the UI
└─ src/ui/App.tsx          Ink chat UI, approval prompt, token usage
   └─ src/agent/run.ts     agent loop: stream → tool calls → approval → execute → repeat
      ├─ agent/tools/      tool definitions (file, shell, code execution, web search)
      ├─ agent/executeTool.ts
      ├─ agent/context/    token estimation, model limits, conversation compaction
      └─ agent/system/     system prompt, history filtering
evals/                     Laminar evals for tool selection and multi-turn runs
test/                      unit tests (vitest), no API key needed
```

The loop in `run.ts` streams a response from the model. If the model requests tools, each call is shown for approval, executed, and its result is appended to the conversation before the next model call. The loop ends when the model answers without tool calls or the user rejects a call.

## Development

```bash
npm test           # unit tests (vitest)
npm run typecheck  # TypeScript
npm run lint       # Biome lint + format check
npm run format     # apply Biome fixes
npm run build      # compile to dist/
```

## Evals

The evals call real models and **cost money**. They need `OPENAI_API_KEY` and `LMNR_PROJECT_API_KEY`.

```bash
npm run eval:file-tools    # single-turn file tool selection
npm run eval:shell-tools   # single-turn shell tool selection
npm run eval:agent         # multi-turn runs with mocked tools
```

Eval results from before version 0.1.0 are not comparable with current results: the single-turn evals now use the agent's real tool definitions, and the multi-turn dataset uses the real `runCommand` tool name.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
