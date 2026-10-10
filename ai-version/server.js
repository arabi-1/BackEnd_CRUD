require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const swaggerDocument = require('./swagger.json');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use('/', protectedRoutes);

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Auth server listening on http://localhost:${port}`);
    console.log(`Swagger documentation available at http://localhost:${port}/docs`);
});

module.exports = app;