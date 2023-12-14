import { getDirName } from "./helperFunctions.mjs";
import { showBanner } from "./helperFunctions.mjs";
import { connectToDatabase } from "./utils/database.utils.mjs";
import {
  accountCreation,
  userLogin,
  editAccount,
} from "./handlers/accountManagement.handler.mjs";
import { showChoiceMenu } from "./handlers/general.handlers.mjs";
import {
  addNewSafeBox,
  getSafeBoxData,
  updateExistingSafeBox,
} from "./handlers/safebox.handler.mjs";
import "dotenv/config";

/**
 * Setting up needed variables
 */
//const abortSignal = AbortSignal.timeout(parseInt(process.env.SIGNAL_TIMEOUT)); // close app if timeout
const ROOT_DIRECTORY = getDirName(import.meta.url);
const DB_CON = await connectToDatabase(ROOT_DIRECTORY);
var CurrentUser;

/**
 * Program Start
 */
showBanner();

/**
 * This function initializes the program and handles the main menu and user interactions.
 */
(async function () {
  try {
    // Display the initial menu and get the user's first choice
    const firstChoice = await showChoiceMenu("Hello Hello dear safe keeper!", [
      { name: "Create new account", value: 1 },
      { name: "Login to existing account", value: 2 },
    ]);

    // Handle the user's first choice
    switch (firstChoice.response) {
      case 1:
        // Create a new account
        CurrentUser = await accountCreation(DB_CON);
        break;
      case 2:
        // Login to an existing account
        CurrentUser = await userLogin(DB_CON);
        break;
    }

    if (CurrentUser) {
      await loggedInOptions();
    }
  } catch (error) {
    // Handle any errors thrown during execution
    throw new Error(error);
  }
})();
