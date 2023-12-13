import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

/**
 * Connects to the database located at the specified root directory.
 * If the database does not exist, it will be created.
 *
 * @param {string} rootDirectory - The root directory where the database is located.
 * @returns {Promise<sqlite3.Database>} - The connected database.
 */
async function connectToDatabase(rootDirectory) {
  // Construct the path to the database file
  const dbPath = path.join(rootDirectory, "/db", "theVault.db");

  return new Promise((resolve, reject) => {
    // Create a new SQLite database connection
    const DB = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE,
      async (err) => {
        if (err) {
          // If the database cannot be opened, create a new one
          if (err.code === "SQLITE_CANTOPEN") {
            console.log("Your database will be created immediately...");
            try {
              const newDB = await createNewDatabase(rootDirectory, dbPath);
              resolve(newDB);
            } catch (e) {
              reject(e);
            }
          } else {
            reject(err);
          }
        } else {
          resolve(DB);
        }
      }
    );
  });
}

/**
 * Creates a new database at the specified path.
 *
 * @param {string} rootDirectory - The root directory of the project.
 * @param {string} dbPath - The path where the new database should be created.
 * @returns {Promise<sqlite3.Database>} - A promise that resolves to the newly created database.
 */
async function createNewDatabase(rootDirectory, dbPath) {
  return new Promise((resolve, reject) => {
    // Create a new sqlite3 database at the specified path
    const DB = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Read the queries for table creation from a file
        const creationQueries = fs.readFileSync(
          path.join(rootDirectory, "/db", "queries", "tablesCreation.sql"),
          "utf-8"
        );

        // Execute the table creation queries on the database
        DB.exec(creationQueries, (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(DB);
        });
      }
    );
  });
}

/**
 * Executes a database manipulation query with parameters.
 *
 * @param {Object} DB - The database object.
 * @param {Object} options - The options for the query.
 * @param {string} options.query - The SQL query to execute.
 * @param {Object} options.params - The parameters for the query.
 * @returns {Promise} - A promise that resolves when the query is executed successfully, or rejects with an error.
 */
function executeDBManipulation(DB, { query, params }) {
  // Extract the parameter values from the params object
  const QueryParams = Object.values(params);

  return new Promise((resolve, reject) => {
    // Execute the database manipulation query with the parameters
    DB.run(query, QueryParams, (err) => (err ? reject(err) : resolve()));
  });
}

/**
 * Query the database and return the result based on the specified type.
 * @param {Object} DB - The database object.
 * @param {Object} options - The query options.
 *   @property {string} query - The SQL query.
 *   @property {Object} params - The query parameters.
 * @param {string} type - The type of query result to return.
 * @returns {Promise} - A promise that resolves with the query result.
 * @throws {Error} - If there is an error querying the database.
 */
async function queryDB(DB, { query, params }, type) {
  const queryParams = Object.values(params);
  try {
    if (type === "singleRow") {
      return await new Promise((resolve, reject) => {
        DB.get(query, queryParams, (err, row) =>
          err ? reject(err) : resolve(row)
        );
      });
    } else {
      return await new Promise((resolve, reject) => {
        DB.all(query, queryParams, (err, rows) =>
          err ? reject(err) : resolve(rows)
        );
      });
    }
  } catch (error) {
    throw error;
  }
}

export { connectToDatabase, executeDBManipulation, queryDB };
