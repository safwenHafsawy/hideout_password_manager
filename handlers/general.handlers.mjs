import inquirer from "inquirer";

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
