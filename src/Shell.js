/**
 * Sidebar shell: the tool registry and the tab bar shown on every root card.
 *
 * A tool is an object { id, label, buildCard(e) } where buildCard returns a
 * Card started from newRootCardBuilder_(tool.id). To add a tool, create
 * src/tools/<Name>/ and add its object to getTools_().
 */

const ROOT_CARD_NAME = 'root';
const ADD_ON_TITLE = 'Antevasin Tools';

function getTools_() {
  return [EmailTemplatesTool, SettingsTool];
}

function findTool_(toolId) {
  const tools = getTools_();
  return tools.find((tool) => tool.id === toolId) || tools[0];
}

/** Builds the root card of a tool (the first tool if toolId is unknown). */
function renderTool_(e, toolId) {
  return findTool_(toolId).buildCard(e);
}

/** A card builder with the add-on header and the tab bar already added. */
function newRootCardBuilder_(activeToolId) {
  return CardService.newCardBuilder()
    .setName(ROOT_CARD_NAME)
    .setHeader(CardService.newCardHeader().setTitle(ADD_ON_TITLE))
    .addSection(buildTabBar_(activeToolId));
}

function buildTabBar_(activeToolId) {
  const buttons = CardService.newButtonSet();
  getTools_().forEach((tool) => {
    buttons.addButton(
      CardService.newTextButton()
        .setText(tool.label)
        .setTextButtonStyle(
          tool.id === activeToolId
            ? CardService.TextButtonStyle.FILLED
            : CardService.TextButtonStyle.OUTLINED
        )
        .setOnClickAction(action_('onTabSelect', { toolId: tool.id }))
    );
  });
  return CardService.newCardSection().addWidget(buttons);
}

function onTabSelect(e) {
  const card = renderTool_(e, param_(e, 'toolId'));
  return respond_(CardService.newNavigation().popToRoot().updateCard(card));
}
