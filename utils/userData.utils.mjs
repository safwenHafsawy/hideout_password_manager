import crypto from "crypto";
import { executeDBManipulation, queryDB } from "./database.utils.mjs";
import {
  hashMasterPassword,
  compareMasterPassword,
} from "./passwords.utils.mjs";

export const insertNewUserData = async function (DB_CON, userDetails) {
  try {
    // checking if username is already used
    const checkUsername = await queryDB(
      DB_CON,
      {
        query: "SELECT username FROM userData WHERE username = ?",
        params: { username: userDetails.username.toLowerCase() },
      },
      "singleRow"
    );

    if (checkUsername) return "USERNAME_USED";

    console.log("Please Hold on while we create your account");

    // Hash the master password
    const hashedPw = await hashMasterPassword(userDetails.masterPassword);

    // Insert user details into the database
    await executeDBManipulation(DB_CON, {
      query:
        "INSERT INTO userData (id, username, masterPassword) VALUES (?,?, ?)",
      params: {
        id: crypto.randomUUID(),
        username: userDetails.username.toLowerCase(),
        password: hashedPw,
      },
    });

    console.log("Account created successfully!");

    // Return the username for further use if needed
    return userDetails.username;
  } catch (err) {
    // Handle any errors that occurred during the process
    throw new Error(err);
  }
};

export const checkUserCred = async function (DB_CON, providedUserDetails) {
  const storedDetails = await queryDB(
    DB_CON,
    {
      query: "SELECT username, masterPassword FROM userData WHERE username = ?",
      params: { username: providedUserDetails.username.toLowerCase() },
    },
    "singleRow"
  );

  if (
    !storedDetails ||
    !(await compareMasterPassword(
      storedDetails.masterPassword,
      providedUserDetails.password
    ))
  ) {
    return false;
  } else {
    return storedDetails.username;
  }
};

export const getUserMasterPW = async function (DB_CON, CurrentUser) {
  try {
    const userMasterPW = await queryDB(
      DB_CON,
      {
        query: "SELECT masterPassword FROM userData WHERE username = ?",
        params: { username: CurrentUser.toLowerCase() },
      },
      "singleRow"
    );

    return userMasterPW;
  } catch (error) {
    throw new Error(error);
  }
};
