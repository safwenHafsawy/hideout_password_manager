import crypto from "crypto";
import { executeDBManipulation, queryDB } from "./database.utils.mjs";
import {
  hashMasterPassword,
  compareMasterPassword,
} from "./passwords.utils.mjs";

/**
 * Inserts new user data into the database.
 * @param {Object} DB_CON - The database connection object.
 * @param {Object} userDetails - The user details object containing username and masterPassword.
 * @returns {string|Object} - Returns "USERNAME_USED" if the username already exists, otherwise returns an object with the userId and username.
 */
export const insertNewUserData = async function (DB_CON, userDetails) {
  try {
    const { username, masterPassword } = userDetails;

    // Check if username already exists in the database
    const usernameExists = await queryDB(
      DB_CON,
      {
        query: "SELECT username FROM userData WHERE username = ?",
        params: { username: username.toLowerCase() },
      },
      "singleRow"
    );

    if (usernameExists) {
      return "USERNAME_USED";
    }

    // Hash the master password
    const hashedPassword = await hashMasterPassword(masterPassword);

    // Generate a unique id
    const id = crypto.randomUUID();

    // Insert the new user data into the database
    await executeDBManipulation(DB_CON, {
      query:
        "INSERT INTO userData (id, username, masterPassword) VALUES (?,?, ?)",
      params: {
        id,
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    });

    return { userId: id, username };
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Checks the user credentials against the stored details in the database.
 * @param {DBConnection} DB_CON - The database connection object.
 * @param {Object} providedUserDetails - The user details provided for authentication.
 * @param {string} providedUserDetails.username - The username.
 * @param {string} providedUserDetails.password - The password.
 * @returns {(boolean|Object)} - False if the credentials are invalid, otherwise an object with user details.
 */
export const checkUserCred = async function (DB_CON, providedUserDetails) {
  // Query the database for the stored user details
  const storedDetails = await queryDB(
    DB_CON,
    {
      query:
        "SELECT id, username, masterPassword FROM userData WHERE username = ?",
      params: { username: providedUserDetails.username.toLowerCase() },
    },
    "singleRow"
  );

  // Check if stored details are found and the master password matches
  if (
    !storedDetails ||
    !(await compareMasterPassword(
      storedDetails.masterPassword,
      providedUserDetails.password
    ))
  ) {
    // Invalid credentials
    return false;
  } else {
    // Valid credentials, return user details
    return { userId: storedDetails.id, username: storedDetails.username };
  }
};

/**
 * Retrieves the user's master password from the database.
 * @param {DBConnection} DB_CON - The database connection.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<string>} - The user's master password.
 * @throws {Error} - If there is an error retrieving the master password.
 */
export const getUserMasterPW = async function (DB_CON, userId) {
  try {
    // Query the database to retrieve the user's master password
    const userMasterPW = await queryDB(
      DB_CON,
      {
        query: "SELECT masterPassword FROM userData WHERE id = ?",
        params: { userId },
      },
      "singleRow"
    );
    return userMasterPW;
  } catch (error) {
    // Throw an error if there is an error retrieving the master password
    throw new Error(error);
  }
};
