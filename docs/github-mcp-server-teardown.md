# Teardown: github/github-mcp-server

Studied at commit `f2a07cd` of https://github.com/github/github-mcp-server (Go, MIT).

## Big picture

An MCP server is a process that speaks JSON-RPC to an AI client (Claude, VS Code, ...) and
exposes **tools** (callable functions with JSON-schema inputs), **resources** and **prompts**.
This one wraps the GitHub REST (go-github) and GraphQL (githubv4) APIs.

```
AI client ──JSON-RPC──► transport (stdio | streamable HTTP)
                          │
                    mcp.Server  (modelcontextprotocol/go-sdk)
                          │
                    inventory  ── filters tools by toolset / read-only / scopes / feature flags
                          │
                 pkg/github/*.go tool handlers ──► GitHub REST + GraphQL
```

## Layout

| Path | Role |
|---|---|
| `cmd/github-mcp-server/main.go` | Cobra CLI: `stdio` and `http` subcommands; flags bound to env via Viper (`GITHUB_*`). |
| `internal/ghmcp/server.go` | Wires auth, clients, and the server together for the stdio mode. |
| `pkg/github/server.go` | `mcp.NewServer(...)` and registration of everything in the inventory. |
| `pkg/github/tools.go` | Toolset definitions (`repos`, `issues`, `pull_requests`, `actions`, ...). |
| `pkg/github/<area>.go` | One file per domain; each tool = schema + handler. `__toolsnaps__/` snapshots every schema so tests catch accidental API changes. |
| `pkg/inventory/` | Registry that decides which tools are exposed (`AddTool` wrappers, typed handlers). |
| `pkg/http`, `internal/oauth`, `internal/githubapp` | Remote/HTTP mode, OAuth login, GitHub App installation tokens. |
| `pkg/lockdown`, `pkg/sanitize` | Safety: restrict content from untrusted authors, strip hidden/prompt-injection text. |

## Key design ideas worth copying

1. **Toolsets** – tools grouped by domain; users enable only what they need
   (`--toolsets repos,issues` or `GITHUB_TOOLSETS`). Keeps the model's context small.
2. **Read-only switch** – `--read-only` drops every tool not annotated read-only.
3. **Scope-aware filtering** – with OAuth, tools needing scopes you didn't grant are hidden.
4. **Schema snapshots** – `__toolsnaps__` JSON files make the tool contract reviewable.
5. **Three auth modes, mutually exclusive** – PAT, GitHub App (app id + installation + key),
   or interactive OAuth.
6. **Two transports** – stdio for local clients, streamable HTTP for the hosted
   endpoint `https://api.githubcopilot.com/mcp/`.

## Toolsets available

`context, repos, git, issues, pull_requests, users, orgs, governance, actions, code_quality,
code_security, secret_protection, dependabot, notifications, discussions, gists,
security_advisories, projects, stargazers, labels, copilot, copilot_spaces,
github_support_docs_search` (plus the `default` and `all` meta-sets).

## Connecting it (see `/.mcp.json`)

1. Create a fine-grained PAT at https://github.com/settings/personal-access-tokens
   with access to the repos you want.
2. `export GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_...`
3. Open this repo in Claude Code – it picks up `.mcp.json` and offers both servers:
   - `github`: the hosted remote server (no install).
   - `github-local`: the same server in Docker, limited to a few toolsets.
   Keep whichever you prefer; `claude mcp list` shows the status.

Equivalent CLI one-liner:
`claude mcp add --transport http github https://api.githubcopilot.com/mcp/ -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN"`
