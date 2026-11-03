/**
 * Entry points named in appsscript.json.
 */

/** Sidebar opened with no email selected. */
function onHomepage(e) {
  return renderTool_(e, null);
}

/** Sidebar opened (or refreshed) with an email open. */
function onGmailMessage(e) {
  return renderTool_(e, null);
}
