const supabase = require('../supabaseClient');

async function requireAuth(req, res, next) {
    const authorization = req.get('Authorization');
    const match = typeof authorization === 'string'
        ? authorization.match(/^Bearer ([^\s]+)$/)
        : null;

    if (!match) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const { data, error } = await supabase.auth.getUser(match[1]);

    if (error || !data || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    return next();
}

module.exports = requireAuth;