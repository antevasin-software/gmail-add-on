/**
 * Helpers for reading card events and building common widgets and responses.
 */

/** All string values of a form field (empty if the field was not submitted). */
function formValues_(e, name) {
  const inputs = e && e.commonEventObject && e.commonEventObject.formInputs;
  const input = inputs && inputs[name];
  return input && input.stringInputs ? input.stringInputs.value : [];
}

/** The first value of a form field, trimmed ('' if absent). */
function formValue_(e, name) {
  return (formValues_(e, name)[0] || '').trim();
}

/** An action parameter ('' if absent). */
function param_(e, name) {
  const params = e && e.commonEventObject && e.commonEventObject.parameters;
  return (params && params[name]) || '';
}

/** An Action calling functionName; params values must be strings. */
function action_(functionName, params) {
  const action = CardService.newAction().setFunctionName(functionName);
  if (params) action.setParameters(params);
  return action;
}

function textInput_(name, title, value, opts) {
  const options = opts || {};
  const input = CardService.newTextInput().setFieldName(name).setTitle(title);
  if (value) input.setValue(value);
  if (options.multiline) input.setMultiline(true);
  if (options.hint) input.setHint(options.hint);
  if (options.onChange) input.setOnChangeAction(options.onChange);
  return input;
}

function paragraph_(html) {
  return CardService.newTextParagraph().setText(html);
}

function escapeHtml_(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** An ActionResponse with optional navigation and notification text. */
function respond_(navigation, notificationText) {
  const builder = CardService.newActionResponseBuilder();
  if (navigation) builder.setNavigation(navigation);
  if (notificationText) {
    builder.setNotification(CardService.newNotification().setText(notificationText));
  }
  return builder.build();
}

function notify_(text) {
  return respond_(null, text);
}
