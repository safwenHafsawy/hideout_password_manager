import { getDirName } from "./helperFunctions.mjs";
import { connectToDatabase } from "./utils/database.utils.mjs";
import {
  accountCreation,
  userLogin,
  showChoiceMenu,
  addNewSafeBox,
  getSafeBoxData,
} from "./utils/handlers.utils.mjs";
import "dotenv/config";

/**
 * Setting up needed variables
 */
const abortSignal = AbortSignal.timeout(parseInt(process.env.SIGNAL_TIMEOUT)); // close app if timeout
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

// init function
(async function () {
  try {
    const firstChoice = await showChoiceMenu("Hello Hello dear safe keeper!", [
      { name: "Create new account ", value: 1 },
      { name: "Login to existing account", value: 2 },
    ]);
    switch (firstChoice.response) {
      case 1:
        CurrentUser = await accountCreation(DB_CON);
        break;
      case 2:
        CurrentUser = await userLogin(DB_CON);
        break;
    }

    if (CurrentUser) {
      //showLoggedInOptions
      const choice = await showChoiceMenu(
        `Welcome ${CurrentUser} ! How can PW manager help you today ? `,
        [
          { name: "Store new password", value: 1 },
          { name: "Get password from DB", value: 2 },
          { name: "Edit account", value: 3 },
          { name: "Exit", value: 4 },
        ]
      );

      switch (choice.response) {
        case 1:
          await addNewSafeBox(DB_CON, CurrentUser);
          break;
        case 2:
          await getSafeBoxData(DB_CON, CurrentUser);
        case 4:
          console.log("See you soon !");
          process.exit(0);
      }
    }
  } catch (e) {
    throw new Error(e);
  }
})();
