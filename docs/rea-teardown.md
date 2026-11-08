# Teardown: REA (Reverse Engineer Anything) + awesome-rea

Studied: [morluto/rea](https://github.com/morluto/rea) at `317bf3f` (npm `rea-agents` 6.8.0, MIT) and
[yibie/awesome-rea](https://github.com/yibie/awesome-rea) at `0ba8f81`.

## REA in one paragraph

REA is a TypeScript MCP server + CLI (`rea-agents`) that lets an AI agent reverse engineer local
targets. The agent asks a question, REA drives real analysis tools (Hopper, Ghidra, IDA, JADX,
Frida, GDB, apktool, ...) or its own built-in static parsers, and returns findings **with
evidence** (code, references, and explicit unknowns). The same workflows are exposed as CLI commands.

```
agent ──MCP (stdio)──► rea mcp
                          │
            src/composition  (wires providers → tools)
                          │
   ┌──────────────────────┼───────────────────────────┐
 external tool bridges     built-in static parsers     runtime probes
 ghidra/ hopper/ ida/      go/ il2cpp/ erlang/ evm/    frida/ gdb/ adb/
 jadx/ cutter/ jeb/ kuna/  gpu/ firmware/ electron/    browser/
```

## Source layout (src/)

- One folder per target or tool (`ghidra/`, `hopper/`, `ida/`, `android/`, `electron/`, `il2cpp/`, `go/`, `gpu/`, `evm/`, `firmware/`, `frida/`, ...).
- `ghidra/` is the richest bridge: launcher, Java probe, per-architecture profiles (PE, MIPS, PowerPC, DOL, PSP), snapshot cache, response router, NativeAOT extension.
- `composition/` assembles the MCP tool surface; analysis work that is heavy (JavaScript, web bundles) runs in separate worker processes.
- `contracts/` + `docs/mcp-contracts.md` define the tool catalog; `REA_MCP_TOOL_FAMILIES` limits which tool families are exposed (same idea as GitHub MCP "toolsets").
- `mcpDoctor.ts` / `rea doctor` check the installation and registrations.

## What it can analyze (selection)

Native binaries (pseudocode, asm, xrefs via Hopper/Ghidra/IDA/Kuna), Android APKs, Electron/JS
apps, Go and Rust binaries (embedded build/crate info), Unity IL2CPP metadata, Godot PCK,
GGUF/safetensors model files, CUDA/HIP code objects, WASM, EVM bytecode, PE imports/certificates,
ELF notes, kernel modules, Erlang BEAM, SQLite DBs, Apple .ips and Linux crash dumps.

Needs Node.js 22.x (>=22.23.4), 24.x (>=24.22.1) or 26.12.1+; external tools only for the targets that use them.

## Design ideas worth copying

1. **Evidence-first answers** – every finding carries what it was based on and what is still unknown.
2. **Bounded inspection** – directory/header reads are capped; response size is limited (`REA_MCP_MAX_RESPONSE_BYTES`).
3. **Tool families** – expose only the tool groups you need, to keep the model's context small.
4. **Setup with consent and backups** – `rea-agents setup` shows proposed config changes and backs up existing files.
5. **Owned-process checks** – it verifies it launched the Ghidra/JADX processes it talks to (needs procps `ps` on Linux).

## awesome-rea

A curated list of *AI-assisted* reverse engineering, organized by one question: **how does the
project define "done"?** (byte match against the original ROM, hash match, build stays green).
Categories: game decompilation, static recompilation/native ports, console & firmware,
tooling & MCP, and a second track for practice discussions. MCP tools it lists:
`HexRaysSA/ida-mcp`, `mrexodia/ida-pro-mcp`, `decomp-compat-kit`, a Claude decompilation skill, and REA.

> ⚠️ awesome-rea links REA to `ReverseEngineer-Anything/REA-Github` as "a local zip". REA's own
> README says to install only from `morluto/rea`, rea.tools or the `rea-agents` npm package,
> and that look-alike repos are not official. Don't install from that link.

## Connecting REA as an MCP server

Run these on **your own machine** (it analyzes local files, so a cloud session isn't useful),
from a trusted directory outside the project you'll analyze:

```bash
npx rea-agents setup      # pick Claude Code, review, approve, then restart Claude Code
rea doctor                # verify
```

Manual alternative (REA recommends local scope, not a committed `.mcp.json`):

```bash
claude mcp add --scope local rea -- "/absolute/path/to/node" "/absolute/path/to/rea/scripts/rea.mjs" mcp
```

Then install Ghidra (free) or Hopper/IDA for native binaries, and ask the agent things like
"how does `<app>` implement `<feature>`?".

Only analyze software you're legally allowed to reverse engineer.
