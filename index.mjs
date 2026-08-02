import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import bcrypt from "bcryptjs";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// EJS configuration
app.set("view engine", "ejs");

// Public CSS, JavaScript, and images
app.use(express.static("public"));

// Allows Express to read HTML form submissions
app.use(express.urlencoded({ extended: true }));

// Configures sessions so users can stay logged in between requests.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// Makes the logged-in user available in every EJS page.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
  waitForConnections: true,
});

// Displays the account signup form.
app.get("/signup", (req, res) => {
  res.render("signup", {
    errorMessage: null,
    formData: {},
  });
});

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Temporary database test
app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT CURDATE() AS currentDate"
    );

    res.send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database connection failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});