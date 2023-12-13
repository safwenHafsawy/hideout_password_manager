import inquirer from "inquirer";
import crypto from "crypto";
import {
  insertNewUserData,
  checkUserCred,
  getUserMasterPW,
} from "./userData.utils.mjs";
import { encryptPw, decryptPw } from "./passwords.utils.mjs";
import { executeDBManipulation, queryDB } from "./database.utils.mjs";

export const showChoiceMenu = async function (message, choices) {
  const userResponse = await inquirer.prompt({
    type: "list",
    name: "response",
    message,
    choices,
  });

  return userResponse;
};

/**
 * Asynchronously creates a new user account in the database.
 *
 * @param {DBConnection} DB_CON - The database connection object.
 * @return {string} The username of the newly created account.
 */
export const accountCreation = async function (DB_CON) {
  try {
    const newUserDetails = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Please choose your username",
        validate(username) {
          if (!username || username.length < 5)
            return "Please provide a username that is at least 5 characters long";
          else return true;
        },
      },
      {
        type: "password",
        name: "masterPassword",
        message:
          "Please enter your master password ! make sure you memoize it cause it unrecoverable",
        prefix: "!!",
        mask: "*",
        validate(password) {
          const pwRegExp = new RegExp("([\\wê_$}{[\\]]){8,}", "g");
          if (!pwRegExp.test(password))
            return "Invalid Password. Please provide a string with 8 or more characters,\n accepted letters '_', 'ê', '$', '}', '{', ']', or '['.";
          else return true;
        },
      },
    ]);

    const newUsername = await insertNewUserData(DB_CON, newUserDetails);

    if (newUsername === "USERNAME_USED") {
      console.log("Username already exists ! Please choose a new username");
      await accountCreation(DB_CON);
    }

    return newUsername;
  } catch (err) {
    throw new Error(err);
  }
};
/**
 * Login the user to the system.
 *
 * @param {DB_CON} DB_CON - The database connection.
 * @return {string|null} The username of the logged in user, or null if the credentials are invalid.
 */
export const userLogin = async function (DB_CON) {
  try {
    const userCred = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Please enter your username ",
      },
      {
        type: "password",
        name: "password",
        message: "Please enter your master password",
        mask: "*",
      },
    ]);

    let username = await checkUserCred(DB_CON, userCred);

    if (!username) {
      console.log("Invalid credentials ! Please try again");
      return await userLogin(DB_CON);
    }
    return username;
  } catch (err) {
    throw new Error(err);
  }
};

export const addNewSafeBox = async (DB_CON, CurrentUser) => {
  try {
    const safeBoxData = await inquirer.prompt([
      {
        type: "input",
        name: "for",
        message: "What account are storing your password for?",
      },
      {
        type: "password",
        name: "password",
        message: "Enter the password you want to put in the safe box",
        mask: "*",
      },
    ]);

    // get user master password (used for encrypting stored passwords)
    const { masterPassword } = await getUserMasterPW(DB_CON, CurrentUser);
    const { encryptedPw, authTag, iv } = encryptPw(
      safeBoxData.password,
      masterPassword
    );

    const queryParams = {
      id: crypto.randomUUID(),
      platform: safeBoxData.for,
      encryptedPw,
      authTag,
      iv,
      CurrentUser,
    };
    await executeDBManipulation(DB_CON, {
      query: "INSERT INTO userPasswords values (?, ?, ?, ?, ?, ?)",
      params: queryParams,
    });

    console.log("New Password added successfully !");
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

export const getSafeBoxData = async (DB_CON, CurrentUser) => {
  try {
    const vaultData = await queryDB(
      DB_CON,
      {
        query: "SELECT * FROM userPasswords WHERE username = ?",
        params: { CurrentUser },
      },
      "allRows"
    );

    const whichPlatform = await inquirer.prompt([
      {
        type: "list",
        name: "platformId",
        message: "Which platform are you looking for?",
        choices: vaultData.map((data) => ({
          name: data.platform,
          value: data.id,
        })),
      },
    ]);

    //getting the password of the selected platform
    const selectedPlatform = vaultData.find(
      (data) => data.id === whichPlatform.platformId
    );

    const { masterPassword } = await getUserMasterPW(DB_CON, CurrentUser);

    const decryptedPw = decryptPw(
      selectedPlatform.encryptedPassword,
      masterPassword,
      selectedPlatform.authTags,
      selectedPlatform.iv
    );

    console.log(`Password for ${selectedPlatform.platform} is ${decryptedPw}`);

    return true;
  } catch (error) {
    throw new Error(error);
  }
};
