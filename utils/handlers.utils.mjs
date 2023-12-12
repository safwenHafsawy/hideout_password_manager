import inquirer from "inquirer";
import { insertNewUserData, checkUserCred } from "./userData.utils.mjs";

export const showMainMenu = async function () {
  const userResponse = await inquirer.prompt({
    type: "list",
    name: "response",
    message: "How Can I help you Today",
    choices: [
      { name: "Create new account ", value: 1 },
      { name: "Login to existing account", value: 2 },
    ],
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
      },
    ]);

    const username = await checkUserCred(DB_CON, userCred);

    if (!username) {
      console.log("Invalid credentials ! Please try again");
      userLogin(DB_CON);
    }
    return username;
  } catch (err) {
    throw new Error(err);
  }
};

export const firstQuestion = async function (inquirer) {
  const answer = await inquirer.prompt({
    type: "list",
    name: "firstQuestion",
    message: "How can PW manager help you today ? ",
    choices: ["Store new password", "Get password for DB"],
  });

  return answer;
};
