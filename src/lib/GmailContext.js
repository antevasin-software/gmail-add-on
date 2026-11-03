/**
 * Access to the email open in Gmail when the sidebar event fired.
 */

/** The open GmailMessage, or null on the homepage (no email selected). */
function getOpenMessage_(e) {
  if (!e || !e.gmail || !e.gmail.messageId) return null;
  GmailApp.setCurrentMessageAccessToken(e.gmail.accessToken);
  return GmailApp.getMessageById(e.gmail.messageId);
}

/** The message's file attachments (inline images excluded). */
function getAttachments_(message) {
  return message ? message.getAttachments({ includeInlineImages: false }) : [];
}

function formatSize_(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
