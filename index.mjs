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

// Validates the signpu form, hashes the pssword, and creates a new user.
app.post("/signup", async (req, res) => {
  const displayName = req.body.displayName?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  // Sends the user back to the form if any field is empty.
  if (!displayName || !email || !password) {
    return res.status(400).render("signup", {
      errorMessage: "All fields are required.",
      formData: {
        displayName,
        email,
      },
    });
  }

  // Requires password to contian at least eight characters.
  if (password.length < 8) {
    return res.status(400).render("signup", {
      errorMessage: "Password must be at least 8 characters.",
      formData: {
        displayName,
        email,
      },
    });
  }

  try {
    // Checks whether an account already uses this email address.
    const [existingUsers] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).render("signup", {
        errorMessage: "An account with this email already exists.",
        formData: {
          displayName,
          email,
        },
      });
    }

    // Converts the password into a secure bcrypt hash.
    const passwordHash = await bcrypt.hash(password, 10);

    // Inserts the new user into the users table.
    await pool.execute(
      `INSERT INTO users (display_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [displayName, email, passwordHash]
    );

    // Sends the new user to the login page after signup succeeds.
    res.redirect("/login");
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).render("signup", {
      errorMessage: "Unable to create your account. Please try again.",
      formData: {
        displayName,
        email,
      },
    });
  }
});

// Displays the login page.
app.get("/login", (req, res) => {
  res.render("login");
});

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Displays all community reports.
app.get("/reports", (req, res) => {
  const sampleReports = [
    {
      report_id: 1,
      display_name: "Sample User",
      report_title: "Earthquake: Minor shaking reported",
      disaster_type: "Earthquake",
      location: "Monterey, California",
      severity: "Minor",
      status: "Resolved",
      event_date: "2026-08-02",
      description: "Brief shaking was reported with no visible damage.",
    },
  ];

  res.render("reports", {
    reports: sampleReports,
  });
});

// Displays the form for adding a community report.
app.get("/report/new", (req, res) => {
  res.render("newReport", {
    displayName:
      req.session.user?.displayName || "Logged-in User",
  });
});

// Displays a temporary pre-filled edit form.
app.get("/report/edit", (req, res) => {
  const sampleReport = {
    report_id: 1,
    report_title: "Earthquake: Minor shaking reported",
    disaster_type: "Earthquake",
    location: "Monterey, California",
    severity: "Minor",
    status: "Resolved",
    event_date: "2026-08-02",
    description: "Brief shaking was reported with no visible damage.",
  };

  res.render("editReport", {
    report: sampleReport,
  });
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