/**
 * Settings tab. This is a placeholder for settings that apply to the whole
 * add-on; per-template settings live in the Email Templates editor.
 */

const SettingsTool = {
  id: 'settings',
  label: '⚙',
  buildCard() {
    return newRootCardBuilder_(this.id)
      .addSection(
        CardService.newCardSection()
          .setHeader('Settings')
          .addWidget(
            paragraph_(
              'Add-on-wide settings will go here.<br><br>' +
                "Each template's Drive folder is set in <b>Templates › Manage templates</b>."
            )
          )
      )
      .build();
  },
};
