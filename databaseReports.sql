-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: sql3.freesqldatabase.com
-- Generation Time: Aug 12, 2026 at 11:38 PM
-- Server version: 5.5.54-0ubuntu0.12.04.1
-- PHP Version: 8.2.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sql3834471`
--
CREATE DATABASE IF NOT EXISTS `sql3834471` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `sql3834471`;

-- --------------------------------------------------------

--
-- Table structure for table `community_reports`
--

DROP TABLE IF EXISTS `community_reports`;
CREATE TABLE IF NOT EXISTS `community_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `report_title` varchar(100) NOT NULL,
  `disaster_type` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `severity` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `event_date` date NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `community_reports`
--

TRUNCATE TABLE `community_reports`;
--
-- Dumping data for table `community_reports`
--

INSERT DELAYED IGNORE INTO `community_reports` (`report_id`, `user_id`, `report_title`, `disaster_type`, `location`, `severity`, `status`, `event_date`, `description`, `created_at`, `updated_at`) VALUES
(16, 12, 'Extreme Temperatures: Heatwave across CA', 'Heatwave', 'California', 'Moderate', 'Improving', '2026-08-12', 'Extreme temperatures along with humidity across all of CA.', '2026-08-13 01:39:59', NULL),
(17, 20, 'Severe Thunderstorms in Nebraska', 'Storm', 'Nebraska', 'Extreme', 'Active', '2026-08-12', 'Severe Thunderstorms in Nebraska may cause localized flooding and damage to power lines.', '2026-08-13 03:01:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `preparedness_tips`
--

DROP TABLE IF EXISTS `preparedness_tips`;
CREATE TABLE IF NOT EXISTS `preparedness_tips` (
  `tip_id` int(11) NOT NULL AUTO_INCREMENT,
  `disaster_type` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `tip_text` text NOT NULL,
  PRIMARY KEY (`tip_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `preparedness_tips`
--

TRUNCATE TABLE `preparedness_tips`;
--
-- Dumping data for table `preparedness_tips`
--

INSERT DELAYED IGNORE INTO `preparedness_tips` (`tip_id`, `disaster_type`, `title`, `tip_text`) VALUES
(1, 'Earthquake', 'Before an Earthquake', 'Secure heavy furniture, prepare an emergency supply kit, and identify safe places to take cover.'),
(2, 'Earthquake', 'During an Earthquake', 'Drop to the ground, take cover under sturdy furniture, and hold on until the shaking stops.'),
(3, 'Earthquake', 'After an Earthquake', 'Check for injuries and hazards, expect aftershocks, and follow instructions from local emergency officials.'),
(4, 'Wildfire', 'Wildfire Preparedness', 'Keep important documents and emergency supplies ready, know your evacuation routes, and leave immediately if officials issue an evacuation order.'),
(5, 'Flood', 'Flood Safety', 'Move to higher ground when flooding is possible and never walk or drive through floodwater.'),
(6, 'Severe Storm', 'Severe Weather Safety', 'Stay indoors away from windows, keep emergency alerts available, and be prepared for power outages.');

-- --------------------------------------------------------

--
-- Table structure for table `saved_earthquakes`
--

DROP TABLE IF EXISTS `saved_earthquakes`;
CREATE TABLE IF NOT EXISTS `saved_earthquakes` (
  `saved_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `api_event_id` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `location` varchar(150) NOT NULL,
  `magnitude` decimal(3,1) NOT NULL,
  `event_date` date NOT NULL,
  `source_url` varchar(255) NOT NULL,
  `personal_note` text,
  `saved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`saved_id`),
  UNIQUE KEY `unique_user_event` (`user_id`,`api_event_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `saved_earthquakes`
--

TRUNCATE TABLE `saved_earthquakes`;
--
-- Dumping data for table `saved_earthquakes`
--

INSERT DELAYED IGNORE INTO `saved_earthquakes` (`saved_id`, `user_id`, `api_event_id`, `title`, `location`, `magnitude`, `event_date`, `source_url`, `personal_note`, `saved_at`) VALUES
(15, 12, 'us6000tkci', 'M 5.1 - 59 km NNW of Barishal, Pakistan', '59 km NNW of Barishal, Pakistan', 5.1, '2026-08-13', 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000tkci', NULL, '2026-08-13 02:15:09'),
(17, 17, 'us6000tk74', 'M 6 - South Sandwich Islands region', 'South Sandwich Islands region', 6.0, '2026-08-12', 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000tk74', 'it was rough!', '2026-08-13 02:47:33'),
(32, 18, 'us6000tkci', 'M 5.1 - 59 km NNW of Barishal, Pakistan', '59 km NNW of Barishal, Pakistan', 5.1, '2026-08-13', 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000tkci', NULL, '2026-08-13 03:17:52');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `users`
--

TRUNCATE TABLE `users`;
--
-- Dumping data for table `users`
--

INSERT DELAYED IGNORE INTO `users` (`user_id`, `display_name`, `email`, `password_hash`, `created_at`) VALUES
(12, 'eduOtter', 'otter@csumb.edu', '$2b$10$oRH9sURqAvpAdXXsavdxb.Nsb/uJ16EX/HurojuISArnj24UyHhKe', '2026-08-13 01:36:56'),
(13, 'OtterOne', 'otterone@gmail.com', '$2b$10$jI6Dlxbec9.i48BAWjloFOALOpMPEkLwSaC/u9aNwu/4o.YJPlGD6', '2026-08-13 01:37:16'),
(15, 'OtterBot', 'otterbot@gmail.com', '$2b$10$XIFh.teY71DFibopGtVgOu1uDESbcTdMDJIAJ22cNcchppzghFUcm', '2026-08-13 02:30:11'),
(16, 'Otter1', 'otter1@csumb.edu', '$2b$10$iKkVpbyWvOjeXzHQFVyw3.SKE2RFbAvb79wY25ciYriHFnRF2ECS.', '2026-08-13 02:33:14'),
(17, 'Otter123', 'otterone123@gmail.com', '$2b$10$i8CLZsg/SFzHbigTMyGtfeP7zBf5Ckco4/J1D87S/vSppDkNirFLO', '2026-08-13 02:44:56'),
(18, 'Lee', 'ww@gmail.com', '$2b$10$8TC6arArw8xu7r/Sds2Nqux7ApSWSfOZvHrjVry/HfiUPNLxU4qzq', '2026-08-13 02:47:01'),
(19, 'Le', 'www@gmail.com', '$2b$10$V.B0HwdL5HTFNv9RXOqCzu.GgC4B5MVLN7qArjWaBcZrGK5DIGOh.', '2026-08-13 02:50:22'),
(20, 'eduOtter2', 'otter2@csumb.edu', '$2b$10$OcCBwDNB0wH9k4rmoSp61OxXfg5jSqvhwaZmlW8Pcvzm46zHt2BPC', '2026-08-13 02:58:46');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `community_reports`
--
ALTER TABLE `community_reports`
  ADD CONSTRAINT `community_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_earthquakes`
--
ALTER TABLE `saved_earthquakes`
  ADD CONSTRAINT `saved_earthquakes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
