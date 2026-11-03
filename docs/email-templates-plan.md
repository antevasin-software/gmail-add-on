# Gmail sidebar add-on: tool shell + Email Templates tool

**Status:** built, not yet tested in Gmail (2026-11-03). See "Changes made while
building" at the end for where the code differs from this plan.

## Context
Spencer wants a Gmail sidebar add-on that will grow into a set of tools. The first
tool is **Email Templates**. With an email open, it should:
- let him pick a saved template, or write a To / Subject / Body on the spot
- attach one or more of the **open email's attachments**
- optionally **save those attachments to Google Drive**: each template stores a
  root folder, and he picks (or creates) a subfolder under it each time
- open a **pre-filled Gmail draft** that he checks and sends himself

Templates are personal to him and have no placeholders. Each template's To address
is fixed, and every field can still be edited before the draft opens.

The repo is empty (no commits yet), so this is a new build.

## Platform constraints that shape the design
- Gmail sidebar add-ons are **Google Workspace add-ons built with Apps Script
  CardService**. They are built from cards, not custom HTML, so we can't use
  free-form layouts, a native tab widget or a file-upload box.
- **Tabs** are built from a row of buttons at the top of every card. The active
  tab's button is filled and the others are outlined. Clicking one swaps the card
  through `Navigation.updateCard`. Each tool registers itself in a list, so adding
  a tool means adding one file and one line.
- **Attachments** are read from the open message through the contextual trigger
  (`GmailApp.setCurrentMessageAccessToken` and `getAttachments()`).
- The **draft** is opened with a compose action: a button runs
  `GmailApp.createDraft(to, subject, body, {attachments})` and returns
  `ComposeActionResponse`, which opens the Gmail compose window.
- **Drive folders** can't be chosen with the Google Picker in Gmail cards, so:
  - template settings take a pasted folder URL, which is checked and shown by name
  - the send panel lists the root folder's subfolders in a dropdown, with
    "+ New subfolder…" to create one by name
- **Templates** are stored as JSON in `PropertiesService.getUserProperties()`
  (9 KB per template, 500 KB in total, which is plenty for plain-text templates).

## Mockups (sidebar is about 300 px wide)

**1. Sidebar shell with an email open: Templates tab, "Use" view**
```
┌──────────────────────────────┐
│ Antevasin Tools              │
│ [■ Templates] [ Tool 2 ] [⚙] │  ← tab bar on every card
├──────────────────────────────┤
│ Template                     │
│ [ Acme – drawings issue   ▾] │  ← or "✎ Write new…"
│                              │
│ To      [ jo@acme.com      ] │
│ Subject [ Drawings rev C   ] │
│ Body                         │
│ ┌──────────────────────────┐ │
│ │ Hi Jo,                   │ │
│ │ Please find attached the │ │
│ │ latest drawings…         │ │
│ └──────────────────────────┘ │
│                              │
│ Attach from this email       │
│ ☑ Drawings-rev-C.pdf  2.1 MB │
│ ☐ Schedule.xlsx       40 KB  │
│                              │
│ Save to Drive                │
│ ☑ Save ticked attachments    │
│ Root: Clients/Acme  (from    │
│       template)              │
│ Subfolder                    │
│ [ 2026-11 Issue C         ▾] │  ← lists subfolders + "+ New…"
├──────────────────────────────┤
│ [Save as template] [Open draft]│  ← fixed footer
└──────────────────────────────┘
```

**2. Templates tab: Manage view (also the home screen when no email is open)**
```
┌──────────────────────────────┐
│ [■ Templates] [ Tool 2 ] [⚙] │
├──────────────────────────────┤
│ Open an email to send its    │
│ attachments with a template. │
│                              │
│ My templates                 │
│ ▸ Acme – drawings issue   ✎ │
│   jo@acme.com                │
│ ▸ Beta – invoice          ✎ │
│   accounts@beta.co.uk        │
│ ▸ Planning submission     ✎ │
│   planning@council.gov.uk    │
├──────────────────────────────┤
│            [ + New template ]│
└──────────────────────────────┘
```

**3. Template editor**
```
┌──────────────────────────────┐
│ ← Back      Edit template    │
├──────────────────────────────┤
│ Name    [ Acme – drawings  ] │
│ To      [ jo@acme.com      ] │
│ Cc      [                  ] │  (optional)
│ Subject [ Drawings rev C   ] │
│ Body    [ multi-line…      ] │
│                              │
│ Drive root folder            │
│ [ paste folder link        ] │
│ ✓ Clients › Acme             │  ← checked and shown by name
├──────────────────────────────┤
│ [Delete]            [ Save ] │
└──────────────────────────────┘
```

**4. New subfolder (chosen from the dropdown)**
```
│ Subfolder                    │
│ [ + New subfolder…        ▾] │
│ Name [ 2026-11 Issue D     ] │
```

**5. After "Open draft"**
The Gmail compose window opens with To, Subject, Body and the ticked files already
attached. The sidebar shows a notification such as "Saved 1 file to Clients › Acme
› 2026-11 Issue C". If a file with the same name is already in that folder, it is
skipped and the notification says so.

## Code structure (clasp, Apps Script V8, plain JS)
```
appsscript.json          manifest: gmail homepage + contextual triggers, scopes
src/
  Main.js                onHomepage / onGmailMessage entry points → Shell
  Shell.js               tab bar builder, tool registry, routing by tab id
  tools/
    EmailTemplates/
      UseCard.js         card 1 (the send panel)
      ManageCard.js      card 2
      EditorCard.js      card 3
      Actions.js         callbacks: saveTemplate, deleteTemplate, openDraft
  lib/
    TemplateStore.js     CRUD over UserProperties (one key per template + index)
    DriveFolders.js      parseFolderUrl, listSubfolders, createSubfolder,
                         saveBlobs (skip duplicates)
    GmailContext.js      getOpenMessage(e), getAttachments(e)
docs/
  email-templates-plan.md   this plan, checked in (status: approved → built)
CLAUDE.md                points to docs/ and explains how to add a tool
.clasp.json / .claspignore / README.md
```
Tool registry contract (in `Shell.js`):
`{ id, label, buildCard(e) }`. `Shell.render(e, toolId)` adds the tab bar and then
calls the tool's `buildCard`. A settings tab (⚙) is reserved for future global
settings and starts out as a stub.

**Scopes** (`appsscript.json`): `gmail.addons.execute`,
`gmail.addons.current.message.readonly`, `gmail.addons.current.action.compose`,
`gmail.compose` (createDraft with attachments), `drive` (list and create in any
folder), `script.locale`. Drive and compose are restricted scopes. That is fine for
a personal or internal install, which is deployed as a test deployment and needs
no Google verification.

## Implementation steps
1. Scaffold: `clasp create --type standalone`, the manifest, `.claspignore`
   (push `src/` only), README with the setup commands.
2. Shell and tab bar, with a placeholder "Tool 2" tab, to prove that switching tabs
   works.
3. `TemplateStore` plus the Manage and Editor cards (create, edit, delete, folder
   URL check).
4. `GmailContext` plus the Use card (template dropdown fills the fields, attachment
   checkboxes).
5. `DriveFolders` plus the subfolder dropdown and "new subfolder" input.
6. `openDraft` action: build the blobs → save to Drive if ticked → `createDraft` →
   `ComposeActionResponse`, with a notification.
7. "Save as template" from the Use card (writing one on the spot and then keeping
   it).
8. Check in `docs/email-templates-plan.md` and `CLAUDE.md`.

## Verification
Apps Script has no practical local runtime, so testing is manual against a **test
deployment** (`clasp push`, then Deploy › Test deployments › Install in Gmail):
- tabs switch both ways, and the card keeps its state after Back
- create, edit and delete a template; it survives a reload; a bad folder URL shows
  an error
- open an email with 2 attachments → pick a template → fields fill → tick 1 →
  pick a subfolder → Open draft → compose window has the right
  To/Subject/Body/attachment
- the file appears in the Drive subfolder; doing it again skips the duplicate
- "+ New subfolder" creates the folder and saves into it
- home screen with no email open shows the Manage view and no errors
- "Write new…" + "Save as template" makes a template that is listed

## Changes made while building
- **Drive save summary.** A compose response can't show a notification, so
  "Saved N files to …" is shown as a banner at the top of the send panel the
  next time it is built, for up to 10 minutes.
- **Send-panel buttons** (Open draft, Save as template, Manage templates) are in
  a section at the bottom of the card, not a fixed footer, because compose
  actions are only known to work reliably on in-card buttons.
- **Tabs** are "Templates" and "⚙". The placeholder "Tool 2" tab was dropped,
  since two tabs are enough to test switching.
- **Cc** is on the send panel as well as in the editor.
- **"Write new…"** shows a "Drive root folder link" box on the send panel, so
  an email written on the spot can also save its attachments to Drive.
- **Subfolder dropdown** lists subfolders most recently updated first, with the
  newest selected by default. It also has "(Root folder itself)" and
  "+ New subfolder…" options. A new subfolder whose name already exists is
  reused, not duplicated.
- **Layout:** `appsscript.json` lives in `src/`, which is clasp's `rootDir`.
  Shared form and response helpers are in `src/lib/Forms.js`.
- **Scopes:** only `gmail.addons.current.action.compose` is used for
  `GmailApp.createDraft`, which is the approach Google documents for compose
  actions. If drafting fails with an authorization error, add
  `https://www.googleapis.com/auth/gmail.compose` to `oauthScopes`.
