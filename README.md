# Agentic Dev Heuristics

This repository contains a structured heuristic framework for agentic software development and a lightweight static web viewer for exploring it.

The core source is [`heuristics.json`](/home/jtimm/dev/github.com/jtimm/agentic-dev-heuristics/heuristics.json), which defines:
- Document metadata (`document_name`, `version`, `purpose`, intended audience)
- A top-level principle: **Own the system, not just the prompt**
- 15 practical heuristics (`H01` to `H15`) with consistent fields such as summary, rationale, failure modes, and review questions
- A recommended operating sequence for agent workflows
- A set of anti-patterns to avoid
- A compact agent-facing summary with mission + rules of thumb

The viewer is a static frontend:
- [`viewer.html`](/home/jtimm/dev/github.com/jtimm/agentic-dev-heuristics/viewer.html)
- [`viewer.css`](/home/jtimm/dev/github.com/jtimm/agentic-dev-heuristics/viewer.css)
- [`viewer.js`](/home/jtimm/dev/github.com/jtimm/agentic-dev-heuristics/viewer.js)

It supports search, section filtering, summary/detail modes, hash-based deep linking (for example `#H06`), and loads `heuristics.json` via `fetch`.

## Serve locally

Because the viewer loads JSON with `fetch`, run a local HTTP server instead of opening the HTML file directly.

1. From this repository root, start a server:

```bash
python3 -m http.server 8000
```

2. Open:

```text
http://localhost:8000/viewer.html
```

3. Stop the server with `Ctrl+C`.
