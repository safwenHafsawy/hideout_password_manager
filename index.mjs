import { getDirName } from "./helperFunctions.mjs";
import { connectToDatabase } from "./utils/database.utils.mjs";
import {
  showMainMenu,
  accountCreation,
  userLogin,
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
console.log("%c/**** WELCOME TO PW MANAGER ****/", "color: #2ecc71;");
console.log("%c/********************************/", "color: #3498db;");

// init function
(async function () {
  try {
    const firstChoice = await showMainMenu();
    console.log(firstChoice.response);
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
      console.log(`Welcome ` + CurrentUser);
    }
  } catch (e) {
    throw new Error(e);
  }
})();
