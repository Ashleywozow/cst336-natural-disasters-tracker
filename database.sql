-- Creates the table used to store registered user accounts.
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores natural-disaster reports created by registered users.
CREATE TABLE community_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_title VARCHAR(100) NOT NULL,
  disaster_type VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  event_date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

-- Stores earthquakes saved by users. Each record belongs to one user.
CREATE TABLE saved_earthquakes (
  saved_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  api_event_id VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  magnitude DECIMAL(3,1) NOT NULL,
  event_date DATE NOT NULL,
  source_url VARCHAR(255) NOT NULL,
  personal_note TEXT,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevents the same user from saving the same USGS event twice.
  UNIQUE KEY unique_user_event (user_id, api_event_id),

  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);