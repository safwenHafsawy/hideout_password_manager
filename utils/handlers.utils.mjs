import inquirer from "inquirer";
import crypto from "crypto";
import {
  insertNewUserData,
  checkUserCred,
  getUserMasterPW,
} from "./userData.utils.mjs";
import { encryptPw, decryptPw } from "./passwords.utils.mjs";
import { executeDBManipulation, queryDB } from "./database.utils.mjs";

/**
 * Show a choice menu to the user and wait for their response.
 *
 * @param {string} message - The message to display to the user.
 * @param {Array<string>} choices - The choices to display in the menu.
 * @returns {Promise<Object>} - A promise that resolves to the user's response.
 */
export const showChoiceMenu = async function (message, choices) {
  // Use the inquirer package to prompt the user with a list of choices
  const userResponse = await inquirer.prompt({
    type: "list",
    name: "response",
    message,
    choices,
  });

  // Return the user's response
  return userResponse;
};

/**
 * Prompts the user to create a new account and inserts the user data into the database.
 * @param {DB_CON} DB_CON - The database connection object.
 * @returns {string} The newly created username.
 * @throws {Error} If an error occurs during the account creation process.
 */
export const accountCreation = async (DB_CON) => {
  try {
    // Prompt the user for new account details
    const newUserDetails = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Please choose your username",
        validate: (username) => {
          if (!username || username.length < 5) {
            return "Please provide a username that is at least 5 characters long";
          }
          return true;
        },
      },
      {
        type: "password",
        name: "masterPassword",
        message:
          "Please enter your master password. Make sure to memoize it as it is unrecoverable.",
        prefix: "!!",
        mask: "*",
        validate: (password) => {
          const pwRegExp = /^[\wê_$}{[\]:;]{8,}$/;
          if (!pwRegExp.test(password)) {
            return "Invalid password. Please provide a string with 8 or more characters, accepted characters are '_', 'ê', '$', '}', '{', ']', or '['.";
          }
          return true;
        },
      },
    ]);

    // Insert the new user data into the database
    const newUsername = await insertNewUserData(DB_CON, newUserDetails);

    // If the username already exists, prompt the user to choose a new username
    if (newUsername === "USERNAME_USED") {
      console.log("Username already exists! Please choose a new username.");
      await accountCreation(DB_CON);
    }

    return newUsername;
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Prompts the user to enter their username and password for login.
 * If the credentials are valid, returns the username.
 * If the credentials are invalid, prompts the user again.
 * @param {DBConnection} DB_CON - The database connection.
 * @returns {Promise<string>} The username of the logged-in user.
 * @throws {Error} If an error occurs during the login process.
 */
export const userLogin = async (DB_CON) => {
  try {
    // Prompt the user to enter their username and password
    const userCred = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Please enter your username",
      },
      {
        type: "password",
        name: "password",
        message: "Please enter your master password",
        mask: "*",
      },
    ]);

    console.log(userCred);

    // Check if the user credentials are valid
    let username = await checkUserCred(DB_CON, userCred);

    // If the credentials are invalid, prompt the user again
    if (!username) {
      console.log("Invalid credentials! Please try again");
      return await userLogin(DB_CON);
    }

    return username;
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Adds a new safe box entry to the user's vault.
 * @param {DBConnection} DB_CON - The database connection.
 * @param {Object} options - The options for the new safe box entry.
 * @param {string} options.userId - The user ID.
 * @returns {boolean} - Indicates whether the new safe box entry was added successfully.
 * @throws {Error} - If an error occurs while adding the new safe box entry.
 */
export const addNewSafeBox = async (DB_CON, { userId }) => {
  try {
    // Prompt the user for safe box data
    const { platform, password } = await inquirer.prompt([
      {
        type: "input",
        name: "platform",
        message: "What account are storing your password for?",
      },
      {
        type: "password",
        name: "password",
        message: "Enter the password you want to put in the safe box",
        mask: "*",
      },
    ]);

    // Get the user's master password used for encrypting stored passwords
    const { masterPassword } = await getUserMasterPW(DB_CON, userId);

    // Encrypt the safe box password
    const { encryptedPw, authTag, iv } = encryptPw(password, masterPassword);

    // Prepare the query parameters for inserting the safe box entry into the database
    const queryParams = {
      id: crypto.randomUUID(),
      platform,
      encryptedPw,
      authTag,
      iv,
      userId,
    };

    // Execute the database manipulation to insert the safe box entry
    await executeDBManipulation(DB_CON, {
      query: "INSERT INTO userVault values (?, ?, ?, ?, ?, ?)",
      params: queryParams,
    });

    // Print success message
    console.log("New Password added successfully !");
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Retrieve safe box data for a given user.
 * @param {DBConnection} DB_CON - The database connection object.
 * @param {string} userId - The user ID.
 * @returns {boolean} - Returns true if the operation is successful.
 * @throws {Error} - Throws an error if there is an issue with the operation.
 */
export const getSafeBoxData = async (DB_CON, { userId }) => {
  try {
    // Retrieve the user's vault data from the database
    const vaultData = await queryDB(
      DB_CON,
      {
        query: "SELECT * FROM userVault WHERE userId = ?",
        params: { userId },
      },
      "allRows"
    );

    // Prompt the user to select a safe box platform
    const whichPlatform = await inquirer.prompt([
      {
        type: "list",
        name: "platformId",
        message: "Which safe box are you opening today?",
        choices: vaultData.map((data) => ({
          name: data.platform,
          value: data.id,
        })),
      },
    ]);

    // Get the password of the selected platform
    const selectedPlatform = vaultData.find(
      (data) => data.id === whichPlatform.platformId
    );

    // Get the user's master password
    const { masterPassword } = await getUserMasterPW(DB_CON, userId);

    // Decrypt the password
    const decryptedPw = decryptPw(
      selectedPlatform.encryptedPassword,
      masterPassword,
      selectedPlatform.authTags,
      selectedPlatform.iv
    );

    // Print the decrypted password for the selected platform
    console.log(`Password for ${selectedPlatform.platform} is ${decryptedPw}`);

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Edits an account in the database.
 * @param {DBConnection} DB_CON - The database connection.
 * @param {string} userId - The user ID.
 * @param {string} username - The current username.
 */
export const editAccount = async (DB_CON, { userId, username }) => {
  try {
    // Prompt user for the action to perform
    const { actionToPerform } = await inquirer.prompt([
      {
        type: "list",
        name: "actionToPerform",
        message: "What do you want to edit exactly?",
        choices: [
          { name: "Edit Username", value: 1 },
          { name: "Delete Account", value: 2 },
        ],
      },
    ]);

    if (actionToPerform === 1) {
      // Prompt user for the new username
      const { newUsername } = await inquirer.prompt([
        {
          type: "input",
          name: "newUsername",
          message: "What should I call you from now on?",
        },
      ]);

      // Update the username in the database
      await executeDBManipulation(DB_CON, {
        query: "UPDATE userData SET username = ? WHERE id = ?",
        params: { username: newUsername.toLowerCase(), userId },
      });

      // Display success message
      console.log("From here on out you shall be known as " + newUsername);
    } else if (actionToPerform === 2) {
      // Prompt user for confirmation
      console.clear();
      const { confirmDelete } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmDelete",
          message:
            "Are you sure you want to delete your account?\n This action is irreversible and you will lose all your stored passwords",
        },
      ]);

      if (confirmDelete) {
        // Delete all of the user stored passwords
        console.log("Delete all your data! Please wait a sec...");
        await executeDBManipulation(DB_CON, {
          query: "DELETE FROM userVault WHERE userId = ?",
          params: { userId },
        });
        // Delete the account from the database
        await executeDBManipulation(DB_CON, {
          query: "DELETE FROM userData WHERE id = ?",
          params: { userId },
        });

        console.log("Your account has been deleted successfully!");
        console.log("Goodbye " + username);
      }
    }
  } catch (error) {
    throw new Error(error);
  }
};
