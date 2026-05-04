require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'vitaltrack',
    password: 'LudySmokey20!2',
    port: 5432,
});

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: "PostgreSQL Connect!", time: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database connect failed.");
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`VitalTrack API running on port ${PORT}`));