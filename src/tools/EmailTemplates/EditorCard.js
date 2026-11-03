/**
 * Create / edit / delete a template.
 *
 * ctx.returnTo is 'manage' (opened from the template list) or 'use' (opened by
 * "Save as template" on the send panel); ctx.manageRoot is '1' when the list
 * is the root card; ctx.confirmDelete shows the second delete step.
 */

function buildEditorCard_(template, folderLink, ctx) {
  const params = { id: template.id || '', returnTo: ctx.returnTo, manageRoot: ctx.manageRoot || '0' };

  const fields = CardService.newCardSection()
    .addWidget(textInput_('name', 'Name', template.name))
    .addWidget(textInput_('to', 'To', template.to))
    .addWidget(textInput_('cc', 'Cc (optional)', template.cc))
    .addWidget(textInput_('subject', 'Subject', template.subject))
    .addWidget(textInput_('body', 'Body', template.body, { multiline: true }))
    .addWidget(
      textInput_('rootFolderLink', 'Drive root folder link', folderLink, {
        hint: 'Paste a Drive folder link',
        onChange: action_('onEditorFormChange', params),
      })
    )
    .addWidget(paragraph_(folderStatusHtml_(folderLink)));

  const buttons = CardService.newButtonSet().addButton(
    CardService.newTextButton()
      .setText('Save')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(action_('onSaveTemplate', params))
  );
  if (template.id) {
    buttons.addButton(
      ctx.confirmDelete
        ? CardService.newTextButton()
            .setText('Confirm delete')
            .setOnClickAction(action_('onDeleteTemplate', Object.assign({ confirm: '1' }, params)))
        : CardService.newTextButton().setText('Delete').setOnClickAction(action_('onDeleteTemplate', params))
    );
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(template.id ? 'Edit template' : 'New template'))
    .addSection(fields)
    .addSection(CardService.newCardSection().addWidget(buttons))
    .build();
}

function folderStatusHtml_(folderLink) {
  const id = parseFolderId_(folderLink);
  if (id === '') return "No Drive folder: attachments won't be saved to Drive.";
  if (id === null) return "⚠ That doesn't look like a Drive folder link.";
  const folder = getFolderOrNull_(id);
  return folder
    ? '✓ ' + escapeHtml_(folder.getName())
    : "⚠ Folder not found, or you don't have access to it.";
}

/** The template being edited, read back from the editor form. */
function templateFromEditorForm_(e) {
  return {
    id: param_(e, 'id'),
    name: formValue_(e, 'name'),
    to: formValue_(e, 'to'),
    cc: formValue_(e, 'cc'),
    subject: formValue_(e, 'subject'),
    body: formValues_(e, 'body')[0] || '',
  };
}

function editorCtx_(e) {
  return { returnTo: param_(e, 'returnTo') || 'manage', manageRoot: param_(e, 'manageRoot') || '0' };
}
