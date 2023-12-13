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
          const pwRegExp = new RegExp("([\\wê_$}{[\\]:;]){8,}", "g");
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

export const addNewSafeBox = async (DB_CON, { userId }) => {
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
    const { masterPassword } = await getUserMasterPW(DB_CON, userId);
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
      userId,
    };

    await executeDBManipulation(DB_CON, {
      query: "INSERT INTO userVault values (?, ?, ?, ?, ?, ?)",
      params: queryParams,
    });

    console.log("New Password added successfully !");
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

export const getSafeBoxData = async (DB_CON, { userId }) => {
  try {
    const vaultData = await queryDB(
      DB_CON,
      {
        query: "SELECT * FROM userVault WHERE userId = ?",
        params: { userId },
      },
      "allRows"
    );

    const whichPlatform = await inquirer.prompt([
      {
        type: "list",
        name: "platformId",
        message: "Which safe box are opening today ?",
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

    const { masterPassword } = await getUserMasterPW(DB_CON, userId);

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
      const newUsername = await inquirer.prompt([
        {
          type: "input",
          name: "newUsername",
          message: "What should I call you from now on?",
        },
      ]);

      // Update the username in the database
      await executeDBManipulation(DB_CON, {
        query: "UPDATE userData SET username = ? WHERE id = ?",
        params: { username: newUsername.newUsername, userId },
      });

      // Display success message
      console.log(
        "From here on out you shall be known as " + newUsername.newUsername
      );
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
        console.log("Delete all you data ! please wait a sec...");
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
    // Throw any errors that occur during the process
    throw new Error(error);
  }
};
