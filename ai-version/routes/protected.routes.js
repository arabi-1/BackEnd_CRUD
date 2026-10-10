const express = require('express');

const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/public/info', (req, res) => {
    res.status(200).json({ message: 'Welcome stranger! This info is public.' });
});

router.get('/protected/profile', requireAuth, (req, res) => {
    res.status(200).json({
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at
    });
});

module.exports = router;