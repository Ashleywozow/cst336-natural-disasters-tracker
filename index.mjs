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

function requireLogin(req, res, next) { 
  if (!req.session.user) { 
    return res.redirect("/login"); 
  } next(); 
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

// Home page
app.get("/", (req, res) => {
  res.render("index", {
    pageTitle: "Natural Disasters Tracker"
  });
});

// Displays current natural events from NASA EONET.
// The EONET API is documented here: https://eonet.gsfc.nasa.gov/docs/v3
app.get("/events", async (req, res) => {
  try {
    const apiUrl =
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20";

    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(
        `NASA EONET API responded with status ${apiResponse.status}`
      );
    }

    const data = await apiResponse.json();

    const events = [];

    for (let event of data.events) {
      events.push({
        title: event.title,
        category: event.categories?.[0]?.title || "Unknown",
        date:
          event.geometry?.length > 0
            ? new Date(
                event.geometry[event.geometry.length - 1].date
              ).toLocaleString()
            : "Unknown",
        sourceUrl: event.sources?.[0]?.url || null,
      });
    }

    res.render("events", {
      events: events,
      errorMessage: null,
    });
  } catch (error) {
    console.error("NASA EONET error:", error);

    res.render("events", {
      events: [],
      errorMessage:
        "Unable to load natural events right now. Please try again later.",
    });
  }
});

// Displays preparedness tips from MySQL.
app.get("/preparedness", async (req, res) => {
  try {
    const [tips] = await pool.execute(
      `SELECT tip_id, disaster_type, title, tip_text
       FROM preparedness_tips
       ORDER BY disaster_type, tip_id`
    );

    res.render("preparedness", {
      tips: tips,
      errorMessage: null,
    });
  } catch (error) {
    console.error("Preparedness error:", error);

    res.render("preparedness", {
      tips: [],
      errorMessage:
        "Unable to load preparedness tips right now. Please try again later.",
    });
  }
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
app.get("/report/new", requireLogin, (req, res) => {
  res.render("newReport", {
    displayName: req.session.user.displayName,
  });
});

// Creates a community report for the logged-in user.
app.post("/report/new", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  let disasterType = req.body.disaster_type;

  if (disasterType === "Other") {
    disasterType = req.body.other_disaster_type?.trim();
  }

  const reportTitle = req.body.report_title?.trim();
  const location = req.body.location?.trim();
  const severity = req.body.severity;
  const status = req.body.status;
  const eventDate = req.body.event_date;
  const description = req.body.description?.trim();

  if (
    !reportTitle ||
    !location ||
    !disasterType ||
    !severity ||
    !status ||
    !eventDate ||
    !description
  ) {
    return res.status(400).send("All report fields are required.");
  }

  try {
    const sql = `
      INSERT INTO community_reports
        (
          user_id,
          report_title,
          disaster_type,
          location,
          severity,
          status,
          event_date,
          description
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      req.session.user.userId,
      reportTitle,
      disasterType,
      location,
      severity,
      status,
      eventDate,
      description,
    ];

    await pool.execute(sql, params);

    res.redirect("/reports");
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).send("Unable to create the report.");
  }
});

// Displays the edit form with the selected report's current data.
app.get("/report/edit", requireLogin, async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const reportId = req.query.reportId;
  const userId = req.session.user.userId;

  if (!reportId) {
    return res.redirect("/reports");
  }

  try {
    const sql = `
      SELECT
        report_id,
        user_id,
        report_title,
        disaster_type,
        location,
        severity,
        status,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
        description
      FROM community_reports
      WHERE report_id = ?
        AND user_id = ?
    `;

    const [rows] = await pool.execute(sql, [
      reportId,
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).send(
        "Report not found or you do not have permission to edit it."
      );
    }

    res.render("editReport", {
      report: rows[0],
    });

  } catch (error) {
    console.error("Edit report error:", error);

    res.status(500).send(
      "Unable to load the report."
    );
  }
});

// Updates a community report owned by the logged-in user.
app.post("/report/edit", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const reportId = req.body.report_id;
  const userId = req.session.user.userId;

  let disasterType = req.body.disaster_type;

  if (disasterType === "Other") {
    disasterType = req.body.other_disaster_type?.trim();
  }

  const reportTitle = req.body.report_title?.trim();
  const location = req.body.location?.trim();
  const severity = req.body.severity;
  const status = req.body.status;
  const eventDate = req.body.event_date;
  const description = req.body.description?.trim();

  if (
    !reportId ||
    !reportTitle ||
    !location ||
    !disasterType ||
    !severity ||
    !status ||
    !eventDate ||
    !description
  ) {
    return res.status(400).send("All report fields are required.");
  }

  try {
    const sql = `
      UPDATE community_reports
      SET
        report_title = ?,
        disaster_type = ?,
        location = ?,
        severity = ?,
        status = ?,
        event_date = ?,
        description = ?,
        updated_at = NOW()
      WHERE report_id = ?
        AND user_id = ?
    `;

    const params = [
      reportTitle,
      disasterType,
      location,
      severity,
      status,
      eventDate,
      description,
      reportId,
      userId,
    ];

    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).send(
        "Report not found or you do not have permission to edit it."
      );
    }

    res.redirect("/reports");

  } catch (error) {
    console.error("Update report error:", error);

    res.status(500).send(
      "Unable to update the report."
    );
  }
});

// Deletes selected reports owned by the logged-in user.
app.post("/report/delete", async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login");
  }

  let reportIds = req.body.report_ids;

  if (!reportIds) {
    return res.redirect("/reports");
  }

  // If only one checkbox was selected,
  // Express gives us a string instead of an array.
  if (!Array.isArray(reportIds)) {
    reportIds = [reportIds];
  }

  try {

    const placeholders = reportIds
      .map(() => "?")
      .join(", ");

    const sql = `
      DELETE FROM community_reports
      WHERE report_id IN (${placeholders})
        AND user_id = ?
    `;

    const params = [
      ...reportIds,
      req.session.user.userId,
    ];

    await pool.execute(sql, params);

    res.redirect("/reports");

  } catch (error) {

    console.error("Delete report error:", error);

    res.status(500).send(
      "Unable to delete the selected reports."
    );
  }
});


// Displays recent earthquakes from the USGS Earthquake API.
// The USGS Earthquake API is documented here: https://earthquake.usgs.gov/fdsnws/event/1/
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

// Displays the logged-in user's saved earthquakes.
app.get("/saved", requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM saved_earthquakes WHERE user_id = ? ORDER BY saved_at DESC`,
      [req.session.user.userId]
    );

    res.render("savedEarthquakes", { savedEarthquakes: rows });
  } catch (error) {
    console.error("Saved earthquakes error:", error);
    res.render("savedEarthquakes", { savedEarthquakes: [] });
  }
});

// Removes one saved earthquake 
app.post("/saved/delete", requireLogin, async (req, res) => {
  const savedId = req.body.savedId;

  try {
    await pool.execute(
      `DELETE FROM saved_earthquakes WHERE saved_id = ? AND user_id = ?`,
      [savedId, req.session.user.userId]
    );

    res.redirect("/saved");
  } catch (error) {
    console.error("Remove saved earthquake error:", error);
    res.redirect("/saved");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});