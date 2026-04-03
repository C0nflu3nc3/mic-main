SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `micbd`;
CREATE DATABASE `micbd` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `micbd`;

DROP TABLE IF EXISTS `Mission_team`;
DROP TABLE IF EXISTS `Mission`;
DROP TABLE IF EXISTS `News_media`;
DROP TABLE IF EXISTS `News_comment`;
DROP TABLE IF EXISTS `News`;
DROP TABLE IF EXISTS `Operation`;
DROP TABLE IF EXISTS `Overall_leader`;
DROP TABLE IF EXISTS `Duel_leader`;
DROP TABLE IF EXISTS `Teams`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL,
  `password` varchar(500) NOT NULL,
  `isAdmin` bit(1) NOT NULL DEFAULT b'0',
  `isJournalist` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teams_user_id` (`user_id`),
  CONSTRAINT `fk_teams_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Operation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Period` date NOT NULL,
  `Comment` varchar(500) DEFAULT NULL,
  `Score` int NOT NULL DEFAULT 0,
  `Team` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_operation_team` (`Team`),
  CONSTRAINT `fk_operation_team` FOREIGN KEY (`Team`) REFERENCES `Teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Overall_leader` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_overall_leader_user_id` (`user_id`),
  CONSTRAINT `fk_overall_leader_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Duel_leader` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_duel_leader_user_id` (`user_id`),
  CONSTRAINT `fk_duel_leader_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `News` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `video_path` varchar(255) DEFAULT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_news_created_at` (`created_at`),
  CONSTRAINT `fk_news_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `News_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `news_id` int NOT NULL,
  `media_path` varchar(255) NOT NULL,
  `media_type` varchar(20) NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_news_media_news_id` (`news_id`),
  KEY `idx_news_media_sort_order` (`news_id`, `sort_order`, `id`),
  CONSTRAINT `fk_news_media_news` FOREIGN KEY (`news_id`) REFERENCES `News` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `News_comment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `news_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_news_comment_news_id` (`news_id`),
  CONSTRAINT `fk_news_comment_news` FOREIGN KEY (`news_id`) REFERENCES `News` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_news_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Mission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `reward` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mission_created_at` (`created_at`),
  CONSTRAINT `fk_mission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Mission_team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `team_id` int NOT NULL,
  `status` varchar(20) NOT NULL,
  `accepted_at` datetime NOT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mission_team_mission_id` (`mission_id`),
  KEY `idx_mission_team_team_id` (`team_id`),
  CONSTRAINT `fk_mission_team_mission` FOREIGN KEY (`mission_id`) REFERENCES `Mission` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mission_team_team` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`),
  CONSTRAINT `fk_mission_team_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_mission_team_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `login`, `password`, `isAdmin`, `isJournalist`) VALUES
(1, 'admin', '2627376jfk@@', b'1', b'0');

INSERT INTO `users` (`login`, `password`, `isAdmin`, `isJournalist`) VALUES
('legion1', 'L1p9Xq2A', b'0', b'0'),
('legion2', 'M7vR3kP1', b'0', b'0'),
('legion3', 'Q2wT8nZ5', b'0', b'0'),
('legion4', 'F6xK1cB9', b'0', b'0'),
('legion5', 'D3mJ8pQ7', b'0', b'0'),
('legion6', 'Z4sW6tH2', b'0', b'0'),
('legion7', 'U1kL9aC5', b'0', b'0'),
('legion8', 'R8bN2fP6', b'0', b'0'),
('legion9', 'S5xD7vM3', b'0', b'0'),
('legion10', 'Y3gH1kT9', b'0', b'0'),
('legion11', 'E6rP4cL8', b'0', b'0'),
('legion12', 'J2wF7sV5', b'0', b'0'),
('journalist', 'J0urnalistMic', b'0', b'1');

INSERT INTO `Teams` (`id`, `name`, `user_id`) VALUES
(1, 'Администрация', 1),
(2, 'Легион 1', 2),
(3, 'Легион 2', 3),
(4, 'Легион 3', 4),
(5, 'Легион 4', 5),
(6, 'Легион 5', 6),
(7, 'Легион 6', 7),
(8, 'Легион 7', 8),
(9, 'Легион 8', 9),
(10, 'Легион 9', 10),
(11, 'Легион 10', 11),
(12, 'Легион 11', 12),
(13, 'Легион 12', 13);

INSERT INTO `Operation` (`Period`, `Comment`, `Score`, `Team`) VALUES
('2026-03-10', 'Стартовый баланс администрации', 999999999, 1);

INSERT INTO `Overall_leader` (`name`, `score`, `user_id`) VALUES
('Администрация', 0, 1),
('Легион 1', 0, 2),
('Легион 2', 0, 3),
('Легион 3', 0, 4),
('Легион 4', 0, 5),
('Легион 5', 0, 6),
('Легион 6', 0, 7),
('Легион 7', 0, 8),
('Легион 8', 0, 9),
('Легион 9', 0, 10),
('Легион 10', 0, 11),
('Легион 11', 0, 12),
('Легион 12', 0, 13);

INSERT INTO `Duel_leader` (`name`, `score`, `user_id`) VALUES
('Администрация', 0, 1),
('Легион 1', 0, 2),
('Легион 2', 0, 3),
('Легион 3', 0, 4),
('Легион 4', 0, 5),
('Легион 5', 0, 6),
('Легион 6', 0, 7),
('Легион 7', 0, 8),
('Легион 8', 0, 9),
('Легион 9', 0, 10),
('Легион 10', 0, 11),
('Легион 11', 0, 12),
('Легион 12', 0, 13);

SET FOREIGN_KEY_CHECKS = 1;
