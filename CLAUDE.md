# Antevasin Tools: Gmail add-on

Google Workspace add-on for Gmail, written in Apps Script (V8, plain JS) with
CardService UI and deployed with clasp (`rootDir` is `src/`). See README.md for
setup and layout.

## Docs to read first

| Doc | Status | What it covers |
|-----|--------|----------------|
| [docs/email-templates-plan.md](docs/email-templates-plan.md) | built, untested in Gmail | Tab shell + Email Templates tool: design, mockups, how it was built |

New plans go in `docs/` as one Markdown file per feature, with a status line
near the top.

## Things to know

- Apps Script puts every file in one global scope. Never reference another
  file's top-level `const` at load time, only inside functions.
- Functions whose names end in `_` are private helpers. Card callbacks (named
  in `action_('…')`) must be global and must not end in `_`.
- There is no local runtime. Check syntax with `node --check` on each file,
  then test in Gmail through a test deployment (`clasp push`, then reload
  Gmail).
- Templates are stored in UserProperties (9 KB per value), and the store
  rejects any template over about 8.5 KB.
- Adding a tool: see "Adding a tool" in README.md (registry in `src/Shell.js`).
