/**
 * The template list. It is the tool's root card on the homepage, and is pushed
 * over the send panel by "Manage templates" when an email is open.
 */

function buildManageCard_(opts) {
  const asRoot = opts.asRoot;
  const builder = asRoot
    ? newRootCardBuilder_(EmailTemplatesTool.id)
    : CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('My templates'));

  const section = CardService.newCardSection();
  if (asRoot) {
    section
      .setHeader('My templates')
      .addWidget(paragraph_('Open an email to send its attachments with a template.'));
  }

  const editParams = { returnTo: 'manage', manageRoot: asRoot ? '1' : '0' };
  const templates = listTemplates_();
  if (!templates.length) section.addWidget(paragraph_('No templates yet.'));
  templates.forEach((t) => {
    section.addWidget(
      CardService.newDecoratedText()
        .setText(escapeHtml_(t.name))
        .setBottomLabel(t.to)
        .setWrapText(true)
        .setOnClickAction(action_('onEditTemplate', Object.assign({ id: t.id }, editParams)))
    );
  });

  return builder
    .addSection(section)
    .setFixedFooter(
      CardService.newFixedFooter().setPrimaryButton(
        CardService.newTextButton()
          .setText('+ New template')
          .setOnClickAction(action_('onEditTemplate', editParams))
      )
    )
    .build();
}
