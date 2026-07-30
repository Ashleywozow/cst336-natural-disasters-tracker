import express from "express";
import mysql from "mysql2/promise";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// EJS configuration
app.set("view engine", "ejs");

// Public CSS, JavaScript, and images
app.use(express.static("public"));

// Allows Express to read HTML form submissions
app.use(express.urlencoded({ extended: true }));

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