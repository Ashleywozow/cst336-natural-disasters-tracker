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

// Blocks a route until the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

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

// Retrieves and displays all community reports.
app.get("/reports", async (req, res) => {
  try {
    const sql = `
      SELECT
        community_reports.*,
        users.display_name,
        DATE_FORMAT(
          community_reports.event_date,
          '%Y-%m-%d'
        ) AS event_date
      FROM community_reports
      JOIN users
        ON community_reports.user_id = users.user_id
      ORDER BY community_reports.created_at DESC
    `;

    const [rows] = await pool.query(sql);

    res.render("reports", {
      reports: rows,
    });
  } catch (error) {
    console.error("Reports error:", error);

    res.status(500).send(
      "Unable to retrieve community reports."
    );
  }
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

// Temporary test route to confirms the USGS API is reachable
// Using my personal db for now
app.get("/earthquakeTest", async (req, res) => {
  try {
    const apiUrl =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=5";

    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`USGS API responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    console.log(data.features[0]);

    res.send(data.features);
  } catch (error) {
    console.error("USGS test route error:", error);
    res.status(500).send("USGS API test failed - check the console.");
  }
});

// Displays recent earthquakes from the USGS Earthquake API.
app.get("/earthquakes", async (req, res) => {
  const minMagnitude = req.query.minMagnitude || "";

  try {
    let apiUrl =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=50";

    if (minMagnitude) {
      apiUrl += `&minmagnitude=${encodeURIComponent(minMagnitude)}`;
    }

    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`USGS API responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Builds a plain array with just the fields the view needs.
    const earthquakes = [];
    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i];

      earthquakes.push({
        id: feature.id,
        place: feature.properties.place,
        magnitude: feature.properties.mag,
        time: new Date(feature.properties.time).toLocaleString(),
        url: feature.properties.url,
      });
    }

    res.render("earthquakes", {
      earthquakes: earthquakes,
      minMagnitude: minMagnitude,
      errorMessage: null,
    });
  } catch (error) {
    console.error("Earthquake list error:", error);

    res.render("earthquakes", {
      earthquakes: [],
      minMagnitude: minMagnitude,
      errorMessage:
        "Unable to load earthquake data right now. Please try again later.",
    });
  }
});

// Displays details for a single earthquake, looked up by its USGS event id.
app.get("/earthquake/details", async (req, res) => {
  const eventId = req.query.id;

  try {
    const apiUrl =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=" +
      encodeURIComponent(eventId) +
      "&format=geojson";

    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`USGS API responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // A single-event query normally returns one Feature directly, but
    // this also handles a FeatureCollection just in case.
    const feature =
      data.type === "FeatureCollection" ? data.features[0] : data;

    if (!feature) {
      throw new Error("Earthquake not found");
    }

    const earthquake = {
      id: feature.id,
      place: feature.properties.place,
      magnitude: feature.properties.mag,
      time: new Date(feature.properties.time).toLocaleString(),
      isoTime: new Date(feature.properties.time).toISOString().slice(0, 10),
      url: feature.properties.url,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    };

    res.render("earthquakeDetails", {
      earthquake: earthquake,
      errorMessage: null,
    });
  } catch (error) {
    console.error("Earthquake details error:", error);

    res.render("earthquakeDetails", {
      earthquake: null,
      errorMessage:
        "Unable to load details for this earthquake. Please try again later.",
    });
  }
});

// Saves an earthquake to the logged-in user's account.
// Login route sets it - update here if that changes.
app.post("/earthquake/save", requireLogin, async (req, res) => {
  const userId = req.session.user.user_id;
  const apiEventId = req.body.apiEventId;
  const title = req.body.title;
  const location = req.body.location;
  const magnitude = req.body.magnitude;
  const eventDate = req.body.eventDate;
  const sourceUrl = req.body.sourceUrl;
  const personalNote = req.body.personalNote;

  try {
    await pool.execute(
      `INSERT INTO saved_earthquakes
        (user_id, api_event_id, title, location, magnitude, event_date, source_url, personal_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        apiEventId,
        title,
        location,
        magnitude,
        eventDate,
        sourceUrl,
        personalNote || null,
      ]
    );

    res.redirect("/saved");
  } catch (error) {

    // A duplicate-key error just means this user already saved this
    // earthquake - send them to their saved list instead of erroring.
    if (error.code === "ER_DUP_ENTRY") {
      return res.redirect("/saved");
    }

    console.error("Save earthquake error:", error);
    res.status(500).send("Unable to save this earthquake right now.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});