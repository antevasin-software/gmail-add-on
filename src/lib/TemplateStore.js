/**
 * Email templates stored as JSON in the user's own script properties.
 * Template shape: { id, name, to, cc, subject, body, rootFolderId }.
 */

const TEMPLATE_INDEX_KEY = 'templates:index';
const TEMPLATE_KEY_PREFIX = 'template:';
// Script properties allow 9 KB per value; leave room for the JSON wrapper.
const TEMPLATE_MAX_BYTES = 8500;

function listTemplates_() {
  const all = PropertiesService.getUserProperties().getProperties();
  return readIndex_(all[TEMPLATE_INDEX_KEY])
    .map((id) => all[TEMPLATE_KEY_PREFIX + id])
    .filter(Boolean)
    .map((json) => JSON.parse(json))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getTemplate_(id) {
  if (!id) return null;
  const json = PropertiesService.getUserProperties().getProperty(TEMPLATE_KEY_PREFIX + id);
  return json ? JSON.parse(json) : null;
}

/** Saves a template, giving it an id if it is new. Returns the saved template. */
function saveTemplate_(template) {
  const saved = Object.assign({}, template, { id: template.id || Utilities.getUuid() });
  const json = JSON.stringify(saved);
  if (Utilities.newBlob(json).getBytes().length > TEMPLATE_MAX_BYTES) {
    throw new Error('This template is too long to save. Shorten the body and try again.');
  }
  withUserLock_(() => {
    const props = PropertiesService.getUserProperties();
    const ids = readIndex_(props.getProperty(TEMPLATE_INDEX_KEY));
    if (ids.indexOf(saved.id) === -1) ids.push(saved.id);
    props.setProperties({
      [TEMPLATE_KEY_PREFIX + saved.id]: json,
      [TEMPLATE_INDEX_KEY]: JSON.stringify(ids),
    });
  });
  return saved;
}

function deleteTemplate_(id) {
  withUserLock_(() => {
    const props = PropertiesService.getUserProperties();
    const ids = readIndex_(props.getProperty(TEMPLATE_INDEX_KEY)).filter((x) => x !== id);
    props.setProperty(TEMPLATE_INDEX_KEY, JSON.stringify(ids));
    props.deleteProperty(TEMPLATE_KEY_PREFIX + id);
  });
}

function readIndex_(json) {
  return json ? JSON.parse(json) : [];
}

function withUserLock_(fn) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}
