const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const db = new sqlite3.Database("./db.sqlite");

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    due_date TEXT
  )`);
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, password],
    () => res.sendStatus(200)
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username=? AND password=?`,
    [username, password],
    (err, user) => {
      if (user) {
        req.session.userId = user.id;
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    });
});

app.get("/todos", (req, res) => {
  db.all(`SELECT * FROM todos WHERE user_id=?`,
    [req.session.userId],
    (err, rows) => res.json(rows)
  );
});

app.post("/todos", (req, res) => {
  const { content, due_date } = req.body;
  db.run(`INSERT INTO todos (user_id, content, due_date) VALUES (?, ?, ?)`,
    [req.session.userId, content, due_date],
    () => res.sendStatus(200)
  );
});

app.delete("/todos/:id", (req, res) => {
  db.run(`DELETE FROM todos WHERE id=?`, [req.params.id],
    () => res.sendStatus(200)
  );
});

app.listen(3000, () => console.log("http://localhost:3000"));
