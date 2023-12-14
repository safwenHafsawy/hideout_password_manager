import inquirer from "inquirer";
import crypto from "crypto";
import { getUserMasterPW } from "../utils/userData.utils.mjs";
import { encryptPw, decryptPw } from "../utils/passwords.utils.mjs";
import { executeDBManipulation, queryDB } from "../utils/database.utils.mjs";

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
 * Updates an existing safe box in the database for a given user.
 * Prompts the user to select the safe box and enter a new password.
 * Updates the password in the database.
 *
 * @param {DBConnection} DB_CON - The database connection object.
 * @param {string} userId - The ID of the user.
 * @throws {Error} If there is an error updating the safe box.
 */
export const updateExistingSafeBox = async (DB_CON, { userId }) => {
  try {
    // Query the database to get the existing safe box data for the user
    const vaultData = await queryDB(
      DB_CON,
      {
        query: "SELECT * FROM userVault WHERE userId = ?",
        params: { userId },
      },
      "allRows"
    );

    // Prompt the user to select the safe box to update
    const { platform } = await inquirer.prompt([
      {
        type: "list",
        name: "platform",
        message: "Which safe box are you updating today?",
        choices: vaultData.map((data) => ({
          name: data.platform,
          value: data.id,
        })),
      },
    ]);

    // Prompt the user to enter a new password for the safe box
    const { newPassword } = await inquirer.prompt([
      {
        type: "password",
        name: "newPassword",
        message: "Enter the password you want to put in the safe box",
        mask: "*",
      },
    ]);

    // Get the user's master password used for encrypting stored passwords
    const { masterPassword } = await getUserMasterPW(DB_CON, userId);

    // Encrypt the safe box password
    const { encryptedPw, authTag, iv } = encryptPw(newPassword, masterPassword);

    // Prepare the query parameters for inserting the safe box entry into the database
    const queryParams = {
      encryptedPw,
      authTag,
      iv,
      platform,
    };

    // Update the password in the database for the selected safe box
    await executeDBManipulation(DB_CON, {
      query:
        "UPDATE userVault SET encryptedPassword = ?, authTags = ?, iv = ? WHERE id = ?",
      params: queryParams,
    });

    // Log success message
    console.log(`Password updated successfully!`);
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

    // Get the encrypted password of the selected platform
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
