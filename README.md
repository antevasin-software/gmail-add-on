# Antevasin Tools: Gmail add-on

A Gmail sidebar add-on that holds a set of tools, each on its own tab. The first
tool is **Templates**. With an email open, it lets you:

- pick a saved email template, or write the To / Cc / Subject / Body on the spot
- tick which of the open email's attachments to send on
- save those attachments to a Drive subfolder under the template's root folder
- open the result as a Gmail draft, which you check and send yourself

Built with Google Apps Script (CardService) and deployed with
[clasp](https://github.com/google/clasp).

## First-time setup

1. Install clasp and sign in:
   ```sh
   npm install -g @google/clasp
   clasp login
   ```
2. Turn on the Apps Script API at https://script.google.com/home/usersettings.
3. Create the Apps Script project from the repo root:
   ```sh
   clasp create --type standalone --title "Antevasin Tools" --rootDir src
   git checkout -- src/appsscript.json   # clasp overwrites the manifest; this restores it (needs a commit first)
   clasp push
   ```
   This writes `.clasp.json`, which holds the script id. Commit it so both
   machines push to the same project.
4. Install it in Gmail as a test deployment: `clasp open-script`, then
   **Deploy › Test deployments › Google Workspace add-on › Install**.
5. Reload Gmail. The add-on icon appears in the right-hand side panel. The first
   time you open it, Google asks you to grant access.

## Day-to-day

```sh
clasp push    # upload changes; reload Gmail to pick them up
```

## Layout

```
src/
  appsscript.json        manifest: triggers and OAuth scopes
  Main.js                entry points (homepage, open email)
  Shell.js               tool registry and tab bar
  lib/                   shared helpers: forms, template store, Drive, Gmail
  tools/EmailTemplates/  the Templates tool (cards and callbacks)
  tools/Settings/        add-on-wide settings tab (placeholder)
docs/                    plans and design notes
```

## Adding a tool

1. Create `src/tools/<Name>/` with an object `{ id, label, buildCard(e) }`.
   `buildCard` should start from `newRootCardBuilder_(id)` so it gets the
   header and the tab bar.
2. Add the object to `getTools_()` in `src/Shell.js`.
3. Callback functions named in `action_('…')` must be global and must not end
   in `_`.
