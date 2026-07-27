import { createServer } from 'node:http';

const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200);
        res.end(JSON.stringify({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] }));
    }
    else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ "status": "ok" }));
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ "error": "Not Found" }));
    }
});
server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:3000');
});