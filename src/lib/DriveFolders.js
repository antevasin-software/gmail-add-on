/**
 * Drive folder helpers: parsing pasted links, listing and creating subfolders,
 * and saving files without overwriting ones already there.
 */

const SUBFOLDER_LIST_LIMIT = 50;

/**
 * Extracts a folder id from a pasted Drive link or a bare id.
 * Returns '' for blank input and null if nothing that looks like an id is found.
 */
function parseFolderId_(linkOrId) {
  const text = (linkOrId || '').trim();
  if (!text) return '';
  const match =
    text.match(/\/folders\/([-\w]{10,})/) ||
    text.match(/[?&]id=([-\w]{10,})/) ||
    text.match(/^([-\w]{10,})$/);
  return match ? match[1] : null;
}

function folderUrl_(id) {
  return 'https://drive.google.com/drive/folders/' + id;
}

/** The folder, or null if it doesn't exist, is trashed or isn't shared with the user. */
function getFolderOrNull_(id) {
  if (!id) return null;
  try {
    const folder = DriveApp.getFolderById(id);
    return folder.isTrashed() ? null : folder;
  } catch (err) {
    return null;
  }
}

/** Immediate subfolders as [{ id, name }], most recently updated first. */
function listSubfolders_(folder) {
  const found = [];
  const it = folder.getFolders();
  while (it.hasNext() && found.length < SUBFOLDER_LIST_LIMIT) {
    const sub = it.next();
    found.push({ id: sub.getId(), name: sub.getName(), updated: sub.getLastUpdated().getTime() });
  }
  return found
    .sort((a, b) => b.updated - a.updated)
    .map((sub) => ({ id: sub.id, name: sub.name }));
}

/** The named subfolder, created if it doesn't exist yet. */
function getOrCreateSubfolder_(folder, name) {
  const existing = folder.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : folder.createFolder(name);
}

/** Saves blobs into folder, skipping names already there. Returns { saved, skipped } names. */
function saveBlobsToFolder_(folder, blobs) {
  const result = { saved: [], skipped: [] };
  blobs.forEach((blob) => {
    const name = blob.getName();
    if (folder.getFilesByName(name).hasNext()) {
      result.skipped.push(name);
    } else {
      folder.createFile(blob);
      result.saved.push(name);
    }
  });
  return result;
}
