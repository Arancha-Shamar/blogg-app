import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, password, role = 'user' } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, role]
    );
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(400).json({ message: 'Username already exists' });
  }
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

  if (!user.rows[0] || !(await bcrypt.compare(password, user.rows[0].password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, username: user.rows[0].username, role: user.rows[0].role });
});

export default router;