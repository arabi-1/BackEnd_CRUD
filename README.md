# BackEnd_CRUD

This repository has the code of the first backed CRUD that I created. It is a RESTful API built with Node.js and Express that allows users to manage a simple list of tasks.

![Task API Swagger UI](swagger_ui.jpeg)
### How to Install and Run
To install the dependencies and start the server, run this single command in your terminal:
```bash
npm install && node server.mjs
## Week 3 - SQLite Database Integration

* **Why SQLite:** It was chosen because it is a serverless, zero-configuration database that lives entirely in a single file (`tasks.db`), allowing data to easily survive server restarts.
* **Database Location:** The database file is named `tasks.db` and is created automatically in the root folder when the application runs for the first time[cite: 1]. 
* **How to run:** Run `node server.mjs` in the terminal to start the server and automatically initialize the database.
* **Example SQL Query:** `SELECT COUNT(*) FROM tasks;` 
  * *Result:* This query returns the total number of task rows currently stored in the database.

*(Note: Add a quick screenshot of tasks.db open in DB Browser here if you have a moment, otherwise leave this placeholder!)*




