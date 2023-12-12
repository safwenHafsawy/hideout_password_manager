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

/**
 * This function is used to extract a key and iv derived from the user's master password
 * @param {Sting} masterPassword
 * @return {Object}
 */
function deriveKeyAndIV(masterPassword) {
  const key = crypto
    .createHash("sha256")
    .update(masterPassword, "utf-8")
    .digest();
  const iv = crypto.randomBytes(32);
  return { key, iv };
}

/**
 * Encrypts a password using a master password.
 *
 * @param {string} txtPw - The password to encrypt.
 * @param {string} masterPassword - The master password to use for encryption.
 * @returns {Object} - An object containing the encrypted password, authentication tag, and initialization vector.
 * @throws {Error} - If an error occurs during encryption.
 */
export function encryptPw(txtPw, masterPassword) {
  try {
    const algorithm = process.env.CRYPT_ALGO;
    const { key, iv } = deriveKeyAndIV(masterPassword);

    // Encryption
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

    let encrypted = cipher.update(txtPw, "utf8", "hex");

    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return { encryptedPw: encrypted, authTag, iv };
  } catch (err) {
    throw new Error(err);
  }
}
/**
 * Decrypts a password using the specified encryption algorithm, master password,
 * authentication tag, and initialization vector (IV).
 *
 * @param {string} encryptedPw - The encrypted password to be decrypted.
 * @param {string} masterPassword - The master password used for decryption.
 * @param {string} authTag - The authentication tag associated with the encrypted password.
 * @param {Buffer} iv - The initialization vector used for decryption.
 * @return {string} The decrypted password.
 */
export function decryptPw(encryptedPw, masterPassword, authTag, iv) {
  try {
    const algorithm = process.env.CRYPT_ALGO;
    const { key } = deriveKeyAndIV(masterPassword);

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encryptedPw, "hex", "utf8");

    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    throw new Error(err);
  }
}
