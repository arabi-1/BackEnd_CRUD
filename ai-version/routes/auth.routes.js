const express = require('express');

const supabase = require('../supabaseClient');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function hasCredentials(body) {
    return body
        && typeof body.email === 'string'
        && body.email.trim() !== ''
        && typeof body.password === 'string'
        && body.password.trim() !== '';
}

router.post('/signup', async (req, res) => {
    if (!hasCredentials(req.body)) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data.user);
});

router.post('/login', async (req, res) => {
    if (!hasCredentials(req.body)) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data || !data.session || !data.user) {
        return res.status(401).json({ error: 'Invalid login credentials' });
    }

    return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user
    });
});

router.post('/logout', requireAuth, async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        return res.status(401).json({ error: 'Unable to log out' });
    }

    return res.status(204).send();
});

module.exports = router;