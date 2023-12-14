import inquirer from "inquirer";
import { insertNewUserData, checkUserCred } from "../utils/userData.utils.mjs";

import { executeDBManipulation } from "../utils/database.utils.mjs";

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
