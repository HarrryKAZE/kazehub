// server/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path to the SQLite database file
const DB_PATH = path.join(__dirname, 'db.sqlite');

let db; // Variable to hold the database connection

/**
 * Initializes the SQLite database connection and creates necessary tables.
 * @returns {Promise<void>} A promise that resolves when the database is initialized.
 */
function initDb() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the SQLite database.');
                // Create 'snippets' table
                db.run(`
                    CREATE TABLE IF NOT EXISTS snippets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        category TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating snippets table:', err.message);
                        reject(err);
                    } else {
                        console.log('Snippets table ensured.');
                        // Create 'subjects' table
                        db.run(`
                            CREATE TABLE IF NOT EXISTS subjects (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                name TEXT NOT NULL UNIQUE COLLATE NOCASE
                            )
                        `, (err) => {
                            if (err) {
                                console.error('Error creating subjects table:', err.message);
                                reject(err);
                            } else {
                                console.log('Subjects table ensured.');
                                // Initialize with default subjects if none exist
                                db.get('SELECT COUNT(*) AS count FROM subjects', (err, row) => {
                                    if (err) {
                                        console.error('Error checking subjects count:', err.message);
                                        reject(err);
                                        return;
                                    }
                                    if (row.count === 0) {
                                        console.log('No subjects found, adding custom defaults.');
                                        // Changed default subjects to sub1, sub2, sub3, sub4, sub5
                                        const defaultSubjects = ['sub1', 'sub2', 'sub3', 'sub4', 'sub5'];
                                        const insertStmt = db.prepare('INSERT INTO subjects (name) VALUES (?)');
                                        defaultSubjects.forEach(subject => {
                                            insertStmt.run(subject, (err) => {
                                                if (err) console.error(`Error inserting default subject ${subject}:`, err.message);
                                            });
                                        });
                                        insertStmt.finalize(() => {
                                            resolve(); // Resolve after defaults are added
                                        });
                                    } else {
                                        resolve(); // Resolve if subjects already exist
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

/**
 * Runs a SQL query that doesn't return data (e.g., INSERT, UPDATE, DELETE).
 * @param {string} sql The SQL query string.
 * @param {Array<any>} params Parameters for the SQL query.
 * @returns {Promise<Object>} A promise that resolves with the result object (e.g., lastID).
 */
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error running SQL:', err.message);
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

/**
 * Runs a SQL query that returns a single row of data (e.g., SELECT single row).
 * @param {string} sql The SQL query string.
 * @param {Array<any>} params Parameters for the SQL query.
 * @returns {Promise<Object|null>} A promise that resolves with the row object, or null if not found.
 */
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error('Error getting row:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Runs a SQL query that returns multiple rows of data (e.g., SELECT multiple rows).
 * @param {string} sql The SQL query string.
 * @param {Array<any>} params Parameters for the SQL query.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of row objects.
 */
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error getting all rows:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Export the database utility functions
module.exports = {
    initDb,
    run,
    get,
    all
};
