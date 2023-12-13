import { getDirName } from "./helperFunctions.mjs";
import { connectToDatabase } from "./utils/database.utils.mjs";
import {
  accountCreation,
  userLogin,
  showChoiceMenu,
  addNewSafeBox,
  getSafeBoxData,
  editAccount,
} from "./utils/handlers.utils.mjs";
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
console.clear();
console.log("%c/********************************/", "color: #3498db;");
console.log(`\
\n\
\n\
\n\
_    _      _                            _          _   _ _     _                  _   \n\
| |  | |    | |                          | |        | | | (_)   | |                | |  \n\
| |  | | ___| | ___ ___  _ __ ___   ___  | |_ ___   | |_| |_  __| | ___  ___  _   _| |_ \n\
| |\\/| |/ _ \\ |/ __/ _ \\| '_ \` _ \\ / _ \\ | __/ _ \\  |  _  | |/ _\` |/ _ \\/ _ \\| | | | __|\n\
\\  /\\  /  __/ | (_| (_) | | | | | |  __/ | || (_) | | | | | | (_| |  __/ (_) | |_| | |_ \n\
 \\/  \\/ \\___|_|\\___\\___/|_| |_| |_|\\___|  \\__\\___/  \\_| |_|_/\\__,_|\\___|\\___/ \\__,_|\\__|\n\
                                                                                       \n\
                                                                                       \n\
`);
console.log("%c/********************************/", "color: #3498db;");

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
      // Display the menu options for logged in users
      const loggedInOptions = [
        { name: "Store new password", value: 1 },
        { name: "Get password from DB", value: 2 },
        { name: "Edit account", value: 3 },
        { name: "Exit", value: 4 },
      ];

      // Display the logged in menu and get the user's choice
      const choice = await showChoiceMenu(
        `Welcome ${CurrentUser.username}! How can PW manager help you today?`,
        loggedInOptions
      );

      // Handle the user's choice from the logged in menu
      switch (choice.response) {
        case 1:
          // Store a new password
          await addNewSafeBox(DB_CON, CurrentUser);
          break;
        case 2:
          // Get password from the database
          await getSafeBoxData(DB_CON, CurrentUser);
          break;
        case 3:
          // Edit the user's account
          await editAccount(DB_CON, CurrentUser);
          break;
        case 4:
          // Exit the program
          console.log("See you soon!");
          process.exit(0);
      }
    }
  } catch (error) {
    // Handle any errors thrown during execution
    throw new Error(error);
  }
})();
