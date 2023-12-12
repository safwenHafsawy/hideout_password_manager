import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Master Password Password handling
 */

/**
 * This function is used to hash the user master password.
 * @param {String} textPw - The user's master password.
 * @returns {String} - The password hashed using bcrypt.
 * @throws {Error} - Throws an error in case of an issue in the hash function.
 */
export const hashMasterPassword = async (textPw) => {
  try {
    // Generate a salt with 20 rounds
    const salt = await bcrypt.genSalt(15);

    // Hash the password using bcrypt and the generated salt
    const hashedPw = await bcrypt.hash(textPw, salt);

    return hashedPw;
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * This function is used to compare the user provided password against the password stored in the database.
 * @param {String} textPw - The user's provided password.
 * @param {String} hashedPw - The hashed password stored in the database.
 * @returns {Boolean} - Indicates whether passwords are a match.
 * @throws {Error} - Throws an error in case of an issue in comparing passwords.
 */
export const compareMasterPassword = async (hashedPw, textPw) => {
  try {
    // Compare the provided password with the stored hashed password
    const isCorrect = await bcrypt.compare(textPw, hashedPw);

    return isCorrect;
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * User stored passwords handling functions
 */
