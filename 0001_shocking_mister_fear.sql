CREATE TABLE `athlete_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sport` varchar(64),
	`experienceLevel` enum('beginner','intermediate','advanced','elite'),
	`trainingGoals` json,
	`weeklyTrainingDays` int,
	`primaryFocus` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athlete_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`stageRequired` int NOT NULL,
	`chakraFocus` json NOT NULL,
	`element` enum('air','fire','water','earth','ether') NOT NULL,
	`durationMinutes` int NOT NULL,
	`targetBreathRate` float NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','master') NOT NULL,
	`description` text,
	`steps` json NOT NULL,
	`inhaleSeconds` float NOT NULL,
	`holdAfterInhaleSeconds` float NOT NULL DEFAULT 0,
	`exhaleSeconds` float NOT NULL,
	`holdAfterExhaleSeconds` float NOT NULL DEFAULT 0,
	`soundFrequency` varchar(16),
	`chakraSoundSyllable` varchar(16),
	`tags` json,
	`isFreeAccess` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocols_id` PRIMARY KEY(`id`),
	CONSTRAINT `protocols_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`protocolId` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`perceivedExertion` int,
	`notes` text,
	`chakraActivation` int,
	`startingBreathRate` float,
	`endingBreathRate` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`stage` int NOT NULL,
	`answers` json,
	`indicators` json,
	`recommendedProtocols` json,
	CONSTRAINT `stage_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','pro','elite') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(32) DEFAULT 'inactive';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionCurrentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `currentStage` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalSessions` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `streakCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActive` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;