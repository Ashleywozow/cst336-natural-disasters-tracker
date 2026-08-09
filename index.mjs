import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import bcrypt from "bcryptjs";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// EJS configuration.
app.set("view engine", "ejs");

// Serves CSS, JavaScript, and images from the public folder.
app.use(express.static("public"));

// Allows Express to read HTML form submissions.
app.use(express.urlencoded({ extended: true }));

// Configures sessions so users stay logged in between requests.
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

// Makes the logged-in user available to every EJS page.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Creates the MySQL database connection pool.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
  waitForConnections: true,
});

// Blocks protected routes until the user is logged in.
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

// Validates the signup form, hashes the password, and creates a user.
app.post("/signup", async (req, res) => {
  const displayName = req.body.displayName?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!displayName || !email || !password) {
    return res.status(400).render("signup", {
      errorMessage: "All fields are required.",
      formData: {
        displayName,
        email,
      },
    });
  }

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

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(
      `INSERT INTO users (display_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [displayName, email, passwordHash]
    );

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

// Displays the login form.
app.get("/login", (req, res) => {
  res.render("login", {
    errorMessage: null,
    formData: {},
  });
});

// Validates login credentials and starts a user session.
app.post("/login", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).render("login", {
      errorMessage: "Email and password are required.",
      formData: {
        email,
      },
    });
  }

  try {
    const [users] = await pool.execute(
      `SELECT user_id, display_name, email, password_hash
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).render("login", {
        errorMessage: "Email or password is incorrect.",
        formData: {
          email,
        },
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).render("login", {
        errorMessage: "Email or password is incorrect.",
        formData: {
          email,
        },
      });
    }

    // Stores the logged-in user using JavaScript camelCase names.
    req.session.user = {
      userId: user.user_id,
      displayName: user.display_name,
      email: user.email,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).render("login", {
      errorMessage: "Unable to log in. Please try again.",
      formData: {
        email,
      },
    });
  }
});

// Destroys the current session and sends the user to the login page.
app.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).send("Unable to log out.");
    }

    res.redirect("/login");
  });
});

// Displays the home page.
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
app.get("/report/new", requireLogin, (req, res) => {
  res.render("newReport", {
    displayName: req.session.user.displayName,
  });
});

// Displays a temporary pre-filled edit form.
app.get("/report/edit", requireLogin, (req, res) => {
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

// Tests the MySQL database connection.
app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT CURDATE() AS currentDate"
    );

    res.send(rows);
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).send("Database connection failed");
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
      throw new Error(
        `USGS API responded with status ${apiResponse.status}`
      );
    }

    const data = await apiResponse.json();

    const earthquakes = [];

    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i];

      earthquakes.push({
        id: feature.id,
        place: feature.properties.place,
        magnitude: feature.properties.mag,
        time: new Date(
          feature.properties.time
        ).toLocaleString(),
        url: feature.properties.url,
      });
    }

    res.render("earthquakes", {
      earthquakes,
      minMagnitude,
      errorMessage: null,
    });
  } catch (error) {
    console.error("Earthquake list error:", error);

    res.render("earthquakes", {
      earthquakes: [],
      minMagnitude,
      errorMessage:
        "Unable to load earthquake data right now. Please try again later.",
    });
  }
});

// Displays details for one earthquake using its USGS event ID.
app.get("/earthquake/details", async (req, res) => {
  const eventId = req.query.id;

  try {
    const apiUrl =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=" +
      encodeURIComponent(eventId) +
      "&format=geojson";

    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(
        `USGS API responded with status ${apiResponse.status}`
      );
    }

    const data = await apiResponse.json();

    const feature =
      data.type === "FeatureCollection"
        ? data.features[0]
        : data;

    if (!feature) {
      throw new Error("Earthquake not found");
    }

    const earthquake = {
      id: feature.id,
      place: feature.properties.place,
      magnitude: feature.properties.mag,
      time: new Date(
        feature.properties.time
      ).toLocaleString(),
      isoTime: new Date(
        feature.properties.time
      )
        .toISOString()
        .slice(0, 10),
      url: feature.properties.url,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    };

    res.render("earthquakeDetails", {
      earthquake,
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
app.post(
  "/earthquake/save",
  requireLogin,
  async (req, res) => {
    const userId = req.session.user.userId;

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
          (
            user_id,
            api_event_id,
            title,
            location,
            magnitude,
            event_date,
            source_url,
            personal_note
          )
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
      if (error.code === "ER_DUP_ENTRY") {
        return res.redirect("/saved");
      }

      console.error("Save earthquake error:", error);
      res
        .status(500)
        .send("Unable to save this earthquake right now.");
    }
  }
);

// Displays only the logged-in user's saved earthquakes.
app.get("/saved", requireLogin, async (req, res) => {
  const userId = req.session.user.userId;

  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM saved_earthquakes
       WHERE user_id = ?
       ORDER BY saved_at DESC`,
      [userId]
    );

    res.render("savedEarthquakes", {
      savedEarthquakes: rows,
    });
  } catch (error) {
    console.error("Saved earthquakes error:", error);

    res.render("savedEarthquakes", {
      savedEarthquakes: [],
    });
  }
});

// Removes one saved earthquake owned by the logged-in user.
app.post(
  "/saved/delete",
  requireLogin,
  async (req, res) => {
    const userId = req.session.user.userId;
    const savedId = req.body.savedId;

    try {
      await pool.execute(
        `DELETE FROM saved_earthquakes
         WHERE saved_id = ?
         AND user_id = ?`,
        [savedId, userId]
      );

      res.redirect("/saved");
    } catch (error) {
      console.error("Remove saved earthquake error:", error);
      res.redirect("/saved");
    }
  }
);

// Starts the Express server.
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});