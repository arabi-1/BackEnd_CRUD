import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// ── Environment validation ────────────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_KEY must be set in .env');
    process.exit(1);
}

// ── Supabase client ───────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth server listening on http://localhost:${PORT}`);
});
