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
        params: [userDetails.username],
      },
      "singleRow"
    );

    if (checkUsername) return "USERNAME_USED";

    console.log("Please Hold on while we create your account");

    // Hash the master password
    const hashedPw = await hashMasterPassword(userDetails.masterPassword);

    // Insert user details into the database
    await executeDBManipulation(DB_CON, {
      query: "INSERT INTO userData (username, masterPassword) VALUES (?, ?)",
      params: {
        username: userDetails.username,
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

export const checkUserCred = async function (DB_CON, inquirer) {
  let repetition = 0;

  const validateCredentials = async () => {
    const providedUserDetails = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Please enter your username",
      },
      {
        type: "password",
        name: "password",
        message: "please enter your master password",
      },
    ]);

    const storedDetails = await queryDB(
      DB_CON,
      {
        query:
          "SELECT username, masterPassword FROM userData WHERE username = ?",
        params: [providedUserDetails.username],
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
      repetition += 1;
      if (repetition < 3) {
        console.log("Invalid credentials! Please try again ");
        await validateCredentials();
      } else {
        console.log("Too many attempts to login. aborting now...");
        process.exit(1);
      }
    } else {
      return storedDetails.username;
    }
  };

  return await validateCredentials();
};
