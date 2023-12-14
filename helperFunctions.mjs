import path from "path";
import { fileURLToPath } from "url";

/**
 * Get the directory name of a module URL.
 * @param {string} moduleUrl - The URL of the module.
 * @returns {string} - The directory name of the module URL.
 */
export const getDirName = (moduleUrl) => {
  // Convert the module URL to a file path.
  const filename = fileURLToPath(moduleUrl);

  // Get the directory name from the file path.
  return path.dirname(filename);
};

/**
 * Clears the console and displays a banner.
 */
export const showBanner = () => {
  console.clear();
  console.log(`
╔══════════════════════════════════════════════════════════╗
  __   __  ___   ______   _______  _______  __   __  _______
  |  | |  ||   | |      | |       ||       ||  | |  ||       |
  |  |_|  ||   | |  _    ||    ___||   _   ||  | |  ||_     _|
  |       ||   | | | |   ||   |___ |  | |  ||  |_|  |  |   |
  |       ||   | | |_|   ||    ___||  |_|  ||       |  |   |
  |   _   ||   | |       ||   |___ |       ||       |  |   |
  |__| |__||___| |______| |_______||_______||_______|  |___|
                                Password Manager
╚═══════════════════════════════════════════════════════════╝
 `);
};

/**
 * Shows the logged in options to the user.
 * @returns {Promise<void>}
 */
const loggedInOptions = async () => {
  showBanner();

  // Define the options available to the user
  const options = [
    { name: "Store new password", value: 0 },
    { name: "Update Existing password", value: 1 },
    { name: "Get password from Safe box", value: 2 },
    { name: "Edit account", value: 3 },
    { name: "Exit", value: 4 },
  ];

  // Show the choice menu to the user and wait for their response
  const choice = await showChoiceMenu(`How can I help you?`, options);

  // Execute the appropriate action based on the user's choice
  switch (choice.response) {
    case 0:
      await addNewSafeBox(DB_CON, CurrentUser);
      break;
    case 1:
      await updateExistingSafeBox(DB_CON, CurrentUser);
      break;
    case 2:
      await getSafeBoxData(DB_CON, CurrentUser);
      break;
    case 3:
      await editAccount(DB_CON, CurrentUser);
      break;
    case 4:
      console.log("See you soon!");
      process.exit(0);
  }

  // Show the post operation choices to the user
  const postOperationChoice = await showChoiceMenu("Where to now?", [
    { name: "Go Back", value: 0 },
    { name: "Exit", value: 1 },
  ]);

  // Execute the appropriate action based on the user's choice
  if (postOperationChoice.response === 0) {
    return loggedInOptions();
  } else if (postOperationChoice.response === 1) {
    console.log("See you soon!");
    process.exit(0);
  }
};
