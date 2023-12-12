import { getDirName } from "./helperFunctions.mjs";
import { connectToDatabase } from "./utils/database.utils.mjs";
import {
  accountCreation,
  userLogin,
  showChoiceMenu,
  addNewSafeBox,
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
console.log(`

╦ ╦┌─┐┬  ┌─┐┌─┐┌┬┐┌─┐  ┌┬┐┌─┐  ╔═╗╦ ╦╔╦╗
║║║├┤ │  │  │ ││││├┤    │ │ │  ╠═╝║║║║║║
╚╩╝└─┘┴─┘└─┘└─┘┴ ┴└─┘   ┴ └─┘  ╩  ╚╩╝╩ ╩


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
        case 4:
          console.log("See you soon !");
          process.exit(0);
      }
    }
  } catch (e) {
    throw new Error(e);
  }
})();
