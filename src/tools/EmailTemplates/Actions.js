/**
 * Card callbacks for the Email Templates tool. They must be global and must not
 * end in "_", because CardService calls them by name.
 */

// --- Send panel -------------------------------------------------------------

function onTemplateChange(e) {
  const template = getTemplate_(formValue_(e, 'templateId'));
  const state = stateFromTemplate_(template, formValues_(e, 'attachments'));
  return respond_(CardService.newNavigation().updateCard(buildUseCard_(getOpenMessage_(e), state)));
}

function onUseFormChange(e) {
  return respond_(CardService.newNavigation().updateCard(buildUseCard_(getOpenMessage_(e), stateFromForm_(e))));
}

/** Saves the ticked attachments to Drive (if asked) and opens the draft. */
function onOpenDraft(e) {
  const email = prepareEmail_(e);
  // A compose response can't carry a notification, so the Drive summary is
  // shown at the top of the send panel the next time it is built.
  if (email.driveSummary) putLastResult_(email.driveSummary.html);
  const draft = GmailApp.createDraft(email.to, email.subject, email.body, email.options);
  return CardService.newComposeActionResponseBuilder().setGmailDraft(draft).build();
}

/** Saves the ticked attachments to Drive (if asked) and sends the email straight away. */
function onSendNow(e) {
  let email;
  try {
    email = prepareEmail_(e);
  } catch (err) {
    return notify_(err.message);
  }
  MailApp.sendEmail(email.to, email.subject, email.body, email.options);
  let text = 'Sent to ' + email.to + '.';
  if (email.driveSummary) text += ' ' + email.driveSummary.text;
  return notify_(text);
}

/**
 * Reads the send panel, saves the ticked attachments to Drive if asked, and
 * returns { to, subject, body, options, driveSummary } ready to draft or send.
 * Throws an Error with a user-facing message if something is missing.
 */
function prepareEmail_(e) {
  const state = stateFromForm_(e);
  if (!state.to) throw new Error('Add a To address first.');

  const attachments = getAttachments_(getOpenMessage_(e));
  const blobs = state.attachments
    .map((i) => attachments[Number(i)])
    .filter(Boolean)
    .map((attachment) => attachment.copyBlob());

  let driveSummary = null;
  if (state.saveToDrive === true && blobs.length) {
    const folder = resolveTargetFolder_(state);
    driveSummary = describeSave_(folder, saveBlobsToFolder_(folder, blobs));
  }

  const options = { attachments: blobs };
  if (state.cc) options.cc = state.cc;
  return { to: state.to, subject: state.subject, body: state.body, options: options, driveSummary: driveSummary };
}

function onSaveAsTemplate(e) {
  const state = stateFromForm_(e);
  const rootFolderId = rootFolderIdForState_(state);
  const template = { name: '', to: state.to, cc: state.cc, subject: state.subject, body: state.body };
  const folderLink = rootFolderId ? folderUrl_(rootFolderId) : state.rootFolderLink;
  const card = buildEditorCard_(template, folderLink, { returnTo: 'use' });
  return respond_(CardService.newNavigation().pushCard(card));
}

function onManageTemplates() {
  return respond_(CardService.newNavigation().pushCard(buildManageCard_({ asRoot: false })));
}

function resolveTargetFolder_(state) {
  const root = getFolderOrNull_(rootFolderIdForState_(state));
  if (!root) throw new Error("The Drive folder can't be found. Check the template's folder link.");
  if (state.subfolderId === ROOT_FOLDER) return root;
  if (state.subfolderId === NEW_SUBFOLDER) {
    if (!state.newSubfolderName) throw new Error('Name the new subfolder, or pick an existing one.');
    return getOrCreateSubfolder_(root, state.newSubfolderName);
  }
  const sub = getFolderOrNull_(state.subfolderId);
  if (!sub) throw new Error('The chosen subfolder no longer exists. Pick another one.');
  return sub;
}

/** The Drive save result as { text } for notifications and { html } (with a folder link) for the banner. */
function describeSave_(folder, result) {
  const name = folder.getName();
  const link = '<a href="' + folderUrl_(folder.getId()) + '">' + escapeHtml_(name) + '</a>';
  const saved = 'Saved ' + plural_(result.saved.length, 'file') + ' to ';
  const skipped = result.skipped.length
    ? ' Skipped ' + plural_(result.skipped.length, 'file') + ' already there: ' + result.skipped.join(', ') + '.'
    : '';
  return {
    text: saved + name + '.' + skipped,
    html: saved + link + '.' + escapeHtml_(skipped),
  };
}

function plural_(n, word) {
  return n + ' ' + word + (n === 1 ? '' : 's');
}

// --- Template list and editor -------------------------------------------------

function onEditTemplate(e) {
  const id = param_(e, 'id');
  const template = id ? getTemplate_(id) : { name: '', to: '', cc: '', subject: '', body: '' };
  if (!template) return notify_('That template no longer exists.');
  const folderLink = template.rootFolderId ? folderUrl_(template.rootFolderId) : '';
  return respond_(CardService.newNavigation().pushCard(buildEditorCard_(template, folderLink, editorCtx_(e))));
}

/** Re-renders the editor so the folder link is checked as soon as it's pasted. */
function onEditorFormChange(e) {
  const card = buildEditorCard_(templateFromEditorForm_(e), formValue_(e, 'rootFolderLink'), editorCtx_(e));
  return respond_(CardService.newNavigation().updateCard(card));
}

function onSaveTemplate(e) {
  const template = templateFromEditorForm_(e);
  if (!template.name) return notify_('Give the template a name.');
  if (!template.to) return notify_('Add a To address.');

  const folderId = parseFolderId_(formValue_(e, 'rootFolderLink'));
  if (folderId === null) return notify_("That doesn't look like a Drive folder link.");
  if (folderId && !getFolderOrNull_(folderId)) {
    return notify_("Drive folder not found, or you don't have access to it.");
  }
  template.rootFolderId = folderId;

  let saved;
  try {
    saved = saveTemplate_(template);
  } catch (err) {
    return notify_(err.message);
  }
  return respond_(navigationAfterEdit_(e, saved), 'Template saved.');
}

function onDeleteTemplate(e) {
  if (param_(e, 'confirm') !== '1') {
    const ctx = Object.assign(editorCtx_(e), { confirmDelete: true });
    const card = buildEditorCard_(templateFromEditorForm_(e), formValue_(e, 'rootFolderLink'), ctx);
    return respond_(CardService.newNavigation().updateCard(card), 'Press Confirm delete to remove this template.');
  }
  deleteTemplate_(param_(e, 'id'));
  return respond_(navigationAfterEdit_(e, null), 'Template deleted.');
}

/** Leaves the editor, refreshing the card it was opened from. */
function navigationAfterEdit_(e, selectedTemplate) {
  const ctx = editorCtx_(e);
  if (ctx.returnTo === 'use') {
    const message = getOpenMessage_(e);
    const root = message
      ? buildUseCard_(message, stateFromTemplate_(selectedTemplate))
      : renderTool_(e, EmailTemplatesTool.id);
    return CardService.newNavigation().popToRoot().updateCard(root);
  }
  return CardService.newNavigation()
    .popCard()
    .updateCard(buildManageCard_({ asRoot: ctx.manageRoot === '1' }));
}
