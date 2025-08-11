// server/server.js

const express = require('express');
const path = require('path');
const db = require('./database'); // Import our database utility module

const app = express();
const PORT = process.env.PORT || 3000; // Use port from environment variable or default to 3000

// Middleware to parse JSON request bodies
app.use(express.json());

// Initialize the database and create tables if they don't exist
db.initDb()
    .then(() => {
        console.log('Database initialized successfully.');
    })
    .catch(err => {
        console.error('Error initializing database:', err.message);
        process.exit(1); // Exit if database fails to init
    });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// --- API Endpoints for Snippets ---

// GET: Retrieve all snippets
app.get('/api/snippets', async (req, res) => {
    try {
        const snippets = await db.all('SELECT id, title, category, content, created_at FROM snippets ORDER BY created_at DESC');
        res.json(snippets);
    } catch (err) {
        console.error('Error fetching snippets:', err.message);
        res.status(500).json({ error: 'Failed to retrieve snippets.' });
    }
});

// GET: Retrieve snippets by subject (for deletion check)
app.get('/api/snippets/by-subject/:subjectName', async (req, res) => {
    const { subjectName } = req.params;
    try {
        const snippets = await db.all('SELECT id FROM snippets WHERE category = ?', [subjectName]);
        res.json(snippets);
    } catch (err) {
        console.error('Error fetching snippets by subject:', err.message);
        res.status(500).json({ error: 'Failed to retrieve snippets for subject check.' });
    }
});


// POST: Create a new snippet
app.post('/api/snippets', async (req, res) => {
    const { title, category, content } = req.body;

    if (!title || !category || !content) {
        return res.status(400).json({ error: 'Title, category, and content are required.' });
    }

    try {
        const result = await db.run(
            'INSERT INTO snippets (title, category, content, created_at) VALUES (?, ?, ?, datetime("now"))',
            [title, category, content]
        );
        res.status(201).json({ id: result.lastID, title, category, content, created_at: new Date().toISOString() });
    } catch (err) {
        console.error('Error creating snippet:', err.message);
        res.status(500).json({ error: 'Failed to create snippet.' });
    }
});

// GET: Retrieve a single snippet by ID
app.get('/api/snippets/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const snippet = await db.get('SELECT id, title, category, content, created_at FROM snippets WHERE id = ?', [id]);

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found.' });
        }
        res.json(snippet);
    }
    catch (err) {
        console.error('Error fetching single snippet:', err.message);
        res.status(500).json({ error: 'Failed to retrieve snippet.' });
    }
});

// --- API Endpoints for Subjects ---

// GET: Retrieve all subjects
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await db.all('SELECT * FROM subjects ORDER BY name ASC');
        res.json(subjects);
    } catch (err) {
        console.error('Error fetching subjects:', err.message);
        res.status(500).json({ error: 'Failed to retrieve subjects.' });
    }
});

// POST: Add a new subject
app.post('/api/subjects', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Subject name is required.' });
    }

    try {
        // Check if subject already exists (case-insensitive)
        const existingSubject = await db.get('SELECT * FROM subjects WHERE name = ? COLLATE NOCASE', [name]);
        if (existingSubject) {
            return res.status(409).json({ error: 'Subject with this name already exists.' });
        }

        const result = await db.run('INSERT INTO subjects (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.lastID, name });
    } catch (err) {
        console.error('Error adding subject:', err.message);
        res.status(500).json({ error: 'Failed to add subject.' });
    }
});

// DELETE: Delete a subject by ID
app.delete('/api/subjects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run('DELETE FROM subjects WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Subject not found.' });
        }
        res.status(200).json({ message: 'Subject deleted successfully.' });
    } catch (err) {
        console.error('Error deleting subject:', err.message);
        res.status(500).json({ error: 'Failed to delete subject.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
