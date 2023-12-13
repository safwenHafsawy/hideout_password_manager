import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Master Password Password handling
 */

/**
 * Hashes the user's master password using bcrypt.
 * @param {String} textPw - The user's master password.
 * @returns {String} - The password hashed using bcrypt.
 * @throws {Error} - Throws an error if there is an issue with the hash function.
 */
export const hashMasterPassword = async (textPw) => {
  try {
    // Generate a salt with 15 rounds
    const salt = await bcrypt.genSalt(15);

    // Hash the password using bcrypt and the generated salt
    const hashedPw = await bcrypt.hash(textPw, salt);

    return hashedPw;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Compare the user-provided password against the password stored in the database.
 *
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
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * User stored passwords handling functions
 */

/**
 * This function is used to derive a key and an initialization vector (IV)
 * from the user's master password.
 *
 * @param {String} masterPassword - The user's master password.
 * @returns {Object} - An object containing the derived key and IV.
 */
function deriveKeyAndIV(masterPassword) {
  // Derive the key by hashing the master password using the SHA-256 algorithm.
  const key = crypto
    .createHash("sha256")
    .update(masterPassword, "utf-8")
    .digest();

  // Generate a random 32-byte IV.
  const iv = crypto.randomBytes(32);

  // Return an object containing the derived key and IV.
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
    // Get the encryption algorithm from the environment variables
    const algorithm = process.env.CRYPT_ALGO;

    // Derive the encryption key and initialization vector from the master password
    const { key, iv } = deriveKeyAndIV(masterPassword);

    // Create a cipher object using the encryption algorithm, the derived key, and the initialization vector
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

    // Encrypt the password
    let encrypted = cipher.update(txtPw, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the authentication tag from the cipher
    const authTag = cipher.getAuthTag();

    // Return an object containing the encrypted password, authentication tag, and initialization vector
    return { encryptedPw: encrypted, authTag, iv };
  } catch (error) {
    throw new Error(error);
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
 * @throws {Error} - If an error occurs decrypting the password.
 */
export function decryptPw(encryptedPw, masterPassword, authTag, iv) {
  try {
    // Get the encryption algorithm from the environment variables
    const algorithm = process.env.CRYPT_ALGO;

    // Derive the encryption key and initialization vector (IV) from the master password
    const { key } = deriveKeyAndIV(masterPassword);

    // Create a decipher object with the algorithm, key, and IV
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

    // Set the authentication tag for the decipher object
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    // Decrypt the encrypted password using the decipher object
    let decrypted = decipher.update(encryptedPw, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Return the decrypted password
    return decrypted;
  } catch (error) {
    throw new Error(error);
  }
}
