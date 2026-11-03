/**
 * The send panel shown when an email is open.
 */

function buildUseCard_(message, state) {
  const builder = newRootCardBuilder_(EmailTemplatesTool.id);

  const lastResult = takeLastResult_();
  if (lastResult) builder.addSection(CardService.newCardSection().addWidget(paragraph_(lastResult)));

  const rootFolderId = rootFolderIdForState_(state);
  const rootFolder = getFolderOrNull_(rootFolderId);
  const params = { driveShown: rootFolder ? '1' : '0' };
  const onChange = action_('onUseFormChange', params);

  return builder
    .addSection(buildEmailSection_(state))
    .addSection(buildAttachmentsSection_(message, state))
    .addSection(buildDriveSection_(state, rootFolderId, rootFolder, onChange))
    .addSection(buildUseButtons_(params))
    .build();
}

function buildEmailSection_(state) {
  const picker = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Template')
    .setFieldName('templateId')
    .setOnChangeAction(action_('onTemplateChange'));
  listTemplates_().forEach((t) => picker.addItem(t.name, t.id, t.id === state.templateId));
  picker.addItem('✎ Write new…', NEW_TEMPLATE, state.templateId === NEW_TEMPLATE);

  return CardService.newCardSection()
    .addWidget(picker)
    .addWidget(textInput_('to', 'To', state.to))
    .addWidget(textInput_('cc', 'Cc (optional)', state.cc))
    .addWidget(textInput_('subject', 'Subject', state.subject))
    .addWidget(textInput_('body', 'Body', state.body, { multiline: true }));
}

function buildAttachmentsSection_(message, state) {
  const section = CardService.newCardSection().setHeader('Attach from this email');
  const attachments = getAttachments_(message);
  if (!attachments.length) return section.addWidget(paragraph_('This email has no attachments.'));

  const input = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.CHECK_BOX)
    .setFieldName('attachments');
  attachments.forEach((attachment, i) => {
    const value = String(i);
    input.addItem(
      attachment.getName() + ' · ' + formatSize_(attachment.getSize()),
      value,
      state.attachments === null || state.attachments.indexOf(value) !== -1
    );
  });
  return section.addWidget(input);
}

function buildDriveSection_(state, rootFolderId, rootFolder, onChange) {
  const section = CardService.newCardSection().setHeader('Save to Drive');
  const writingNew = state.templateId === NEW_TEMPLATE;
  if (writingNew) {
    section.addWidget(
      textInput_('rootFolderLink', 'Drive root folder link', state.rootFolderLink, {
        hint: 'Paste a Drive folder link',
        onChange: onChange,
      })
    );
  }

  if (rootFolderId === null) return section.addWidget(paragraph_("⚠ That doesn't look like a Drive folder link."));
  if (!rootFolderId) {
    return section.addWidget(
      paragraph_(
        writingNew
          ? 'Paste a folder link to save the attachments to Drive.'
          : 'This template has no Drive folder. Add one in Manage templates.'
      )
    );
  }
  if (!rootFolder) return section.addWidget(paragraph_("⚠ Drive folder not found, or you don't have access to it."));

  section
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.CHECK_BOX)
        .setFieldName('saveToDrive')
        .addItem('Save ticked attachments to Drive', 'yes', state.saveToDrive !== false)
    )
    .addWidget(
      CardService.newDecoratedText()
        .setTopLabel('Root folder')
        .setText(escapeHtml_(rootFolder.getName()))
        .setOpenLink(CardService.newOpenLink().setUrl(folderUrl_(rootFolderId)))
    );

  const subfolders = listSubfolders_(rootFolder);
  let selected = state.subfolderId;
  if (
    selected !== ROOT_FOLDER &&
    selected !== NEW_SUBFOLDER &&
    !subfolders.some((sub) => sub.id === selected)
  ) {
    selected = subfolders.length ? subfolders[0].id : ROOT_FOLDER;
  }

  const picker = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Subfolder')
    .setFieldName('subfolderId')
    .setOnChangeAction(onChange);
  subfolders.forEach((sub) => picker.addItem(sub.name, sub.id, sub.id === selected));
  picker.addItem('(Root folder itself)', ROOT_FOLDER, selected === ROOT_FOLDER);
  picker.addItem('+ New subfolder…', NEW_SUBFOLDER, selected === NEW_SUBFOLDER);
  section.addWidget(picker);

  if (selected === NEW_SUBFOLDER) {
    section.addWidget(textInput_('newSubfolderName', 'New subfolder name', state.newSubfolderName));
  }
  return section;
}

function buildUseButtons_(params) {
  const buttons = CardService.newButtonSet()
    .addButton(
      CardService.newTextButton()
        .setText('Open draft')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setComposeAction(action_('onOpenDraft', params), CardService.ComposedEmailType.STANDALONE_DRAFT)
    )
    .addButton(
      CardService.newTextButton()
        .setText('Save as template')
        .setOnClickAction(action_('onSaveAsTemplate', params))
    )
    .addButton(
      CardService.newTextButton().setText('Manage templates').setOnClickAction(action_('onManageTemplates'))
    );
  return CardService.newCardSection().addWidget(buttons);
}
