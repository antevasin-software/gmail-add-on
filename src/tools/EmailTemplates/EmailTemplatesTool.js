/**
 * Email Templates tool: pick or write an email, attach files from the open
 * email, optionally save them to a Drive subfolder, and open it as a draft.
 */

const NEW_TEMPLATE = '__new__';
const ROOT_FOLDER = '__root__';
const NEW_SUBFOLDER = '__new__';
const LAST_RESULT_KEY = 'templates:lastResult';
const LAST_RESULT_SECONDS = 600;

const EmailTemplatesTool = {
  id: 'templates',
  label: 'Templates',
  buildCard(e) {
    const message = getOpenMessage_(e);
    if (!message) return buildManageCard_({ asRoot: true });
    return buildUseCard_(message, stateFromTemplate_(listTemplates_()[0] || null));
  },
};

/**
 * Use-card state for a template, or a blank email when template is null.
 * attachments null means "tick all"; saveToDrive null means "default (on)";
 * subfolderId '' means "default (most recently updated subfolder)".
 */
function stateFromTemplate_(template, attachments) {
  return {
    templateId: template ? template.id : NEW_TEMPLATE,
    to: template ? template.to : '',
    cc: template ? template.cc || '' : '',
    subject: template ? template.subject : '',
    body: template ? template.body : '',
    rootFolderLink: '',
    attachments: attachments || null,
    saveToDrive: null,
    subfolderId: '',
    newSubfolderName: '',
  };
}

/** Use-card state read back from a submitted Use card. */
function stateFromForm_(e) {
  return {
    templateId: formValue_(e, 'templateId') || NEW_TEMPLATE,
    to: formValue_(e, 'to'),
    cc: formValue_(e, 'cc'),
    subject: formValue_(e, 'subject'),
    body: formValues_(e, 'body')[0] || '',
    rootFolderLink: formValue_(e, 'rootFolderLink'),
    attachments: formValues_(e, 'attachments'),
    // An unticked checkbox isn't submitted, so only trust it if it was on the card.
    saveToDrive: param_(e, 'driveShown') === '1' ? formValues_(e, 'saveToDrive').length > 0 : null,
    subfolderId: formValue_(e, 'subfolderId'),
    newSubfolderName: formValue_(e, 'newSubfolderName'),
  };
}

/** The Drive root folder id for the state: '' if none, null if a pasted link is invalid. */
function rootFolderIdForState_(state) {
  if (state.templateId === NEW_TEMPLATE) return parseFolderId_(state.rootFolderLink);
  const template = getTemplate_(state.templateId);
  return (template && template.rootFolderId) || '';
}

function putLastResult_(html) {
  CacheService.getUserCache().put(LAST_RESULT_KEY, html, LAST_RESULT_SECONDS);
}

/** The last Drive-save summary, cleared once read. */
function takeLastResult_() {
  const cache = CacheService.getUserCache();
  const html = cache.get(LAST_RESULT_KEY);
  if (html) cache.remove(LAST_RESULT_KEY);
  return html;
}
