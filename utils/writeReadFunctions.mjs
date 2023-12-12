/**
 * FILES READ WRITE FUNCTIONS
 */

/**
 * Adds new data to a JSON file.
 *
 * @param {Object} fs - The file system object.
 * @param {String} filePath - The path of the file that will be modified.
 * @param {String | Number} data - The new data that will be added.
 * @param {String} field - The name of the field that will be either modified or added.
 * @returns {Promise<String>} A promise that resolves to a success message or rejects with an error message.
 */
const writeInFile = async (fs, filePath, data, field) => {
  try {
    // Read existing data from the file
    let fileData = await readFileContent(fs, filePath);

    // Add or modify the specified field with the new data
    fileData = {
      ...fileData,
      [field]: data,
    };

    console.log(fileData);

    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(fileData));
    return "Data processed successfully";
  } catch (err) {
    // Handle errors during the process
    return "Error modifying file";
  }
};

/**
 * Reads a JSON file and returns its content.
 *
 * @param {Object} fs - The file system object.
 * @param {String} filePath - The path of the file to be read.
 * @returns {Promise<Object>} A promise that resolves to the content of the JSON file or rejects with an error.
 * @throws {Error} Throws an error if the file is not found or cannot be read.
 */
const readFileContent = async (fs, filePath) => {
  try {
    // Check if the file exists before attempting to read
    const exists = await fs.access(filePath, fs.constants.F_OK);
    console.log(filePath);
    if (!exists) {
      // Skip reading the file and return
      return false;
    }

    // Read the JSON file and parse its content
    const fileData = await JSON.parse(await fs.readFile(filePath, "utf8"));

    return fileData;
  } catch (err) {
    // Throw an error if the file cannot be read
    console.error(err);
    throw new Error(`Could not read file at ${filePath} ! `);
  }
};

module.exports = { writeInFile, readFileContent };
