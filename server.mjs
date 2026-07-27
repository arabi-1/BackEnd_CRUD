import { createServer } from 'node:http';
const tasks = [
    { id: 1, title: 'Learn Node', done: true },
    { id: 2, title: 'Build API', done: false },
    { id: 3, title: 'Push to Github', done: false }
];

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
    else if (req.method === 'GET' && req.url === '/tasks') {
        res.writeHead(200);
        res.end(JSON.stringify(tasks));
    }
    else if (req.method === 'GET' && req.url.startsWith('/tasks/')) {
        const id = parseInt(req.url.split('/')[2]);
        const task = tasks.find(t => t.id === id);
        if (task) {
            res.writeHead(200);
            res.end(JSON.stringify(task));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ "error": `Task ${id} not found` }));
        }
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ "error": "Not Found" }));
    }
});
server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:3000');
});