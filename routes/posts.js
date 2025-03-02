import express from 'express';
import { pool } from '../config/db.js';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const { id: userId } = req.user;

  try {
    await pool.query(
      'INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3)',
      [title, content, userId]
    );
    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});


router.get('/', async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT posts.*, users.username AS author
      FROM posts
      JOIN users ON posts.author_id = users.id
      ORDER BY created_at DESC
    `);
    res.json(posts.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});


router.put('/:id', authenticateToken, async (req, res) => {
  const { id: postId } = req.params;
  const { title, content } = req.body;
  const { id: userId } = req.user;

  try {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.rows[0].author_id !== userId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }


    await pool.query(
      'UPDATE posts SET title = $1, content = $2 WHERE id = $3',
      [title, content, postId]
    );
    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
});


router.delete('/:id', authenticateToken, async (req, res) => {
  const { id: postId } = req.params;
  const { id: userId, role } = req.user;

  try {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }


    if (post.rows[0].author_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

export default router;
