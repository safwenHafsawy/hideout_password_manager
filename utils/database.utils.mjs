import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

async function connectToDatabase(rootDirectory) {
  const dbPath = path.join(rootDirectory, "/db", "theVault.db");
  return new Promise(async (resolve, reject) => {
    let DB;
    DB = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (err) => {
      if (err) {
        if (err.code === "SQLITE_CANTOPEN") {
          console.log(
            "I can see this is your first time! Your database will be created immediately..."
          );
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
    });
  });
}

async function createNewDatabase(rootDirectory, dbPath) {
  return new Promise((resolve, reject) => {
    let DB;
    DB = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
      (err) => {
        if (!err) {
          const creationQueries = fs.readFileSync(
            path.join(rootDirectory, "/db", "queries", "tablesCreation.sql"),
            "utf-8"
          );

          DB.exec(creationQueries, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(DB);
            }
          });
        } else {
          reject(err);
        }
      }
    );
  });
}

function executeDBManipulation(DB, { query, params }) {
  return new Promise((resolve, reject) => {
    const QueryParams = Object.values(params);

    DB.run(query, QueryParams, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function queryDB(DB, { query, params }, type) {
  return new Promise((resolve, reject) => {
    const queryParams = Object.values(params);

    if (type === "singleRow") {
      DB.get(query, queryParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } else {
      DB.all(query, queryParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    }
  });
}

export { connectToDatabase, executeDBManipulation, queryDB };
