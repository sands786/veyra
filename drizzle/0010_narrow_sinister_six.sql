CREATE TABLE `launchpadProjectOps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerLabel` varchar(160) NOT NULL,
	`roundType` enum('community','strategic','treasury','grant') NOT NULL DEFAULT 'community',
	`stage` enum('planning','review','live','closeout') NOT NULL DEFAULT 'planning',
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`operationalNotes` text,
	`readinessOverride` enum('none','blocked','ready') NOT NULL DEFAULT 'none',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launchpadProjectOps_id` PRIMARY KEY(`id`),
	CONSTRAINT `launchpadProjectOps_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `launchpadReleaseRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`milestoneId` int NOT NULL,
	`requestedByUserId` int NOT NULL,
	`requestedAmount` varchar(80) NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('pending','approved','rejected','settled') NOT NULL DEFAULT 'pending',
	`decidedByUserId` int,
	`decidedAt` timestamp,
	`proofReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launchpadReleaseRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `launchpadProjectOps_project_idx` ON `launchpadProjectOps` (`projectId`);--> statement-breakpoint
CREATE INDEX `launchpadReleaseRequests_project_idx` ON `launchpadReleaseRequests` (`projectId`);--> statement-breakpoint
CREATE INDEX `launchpadReleaseRequests_milestone_idx` ON `launchpadReleaseRequests` (`milestoneId`);--> statement-breakpoint
CREATE INDEX `launchpadReleaseRequests_status_idx` ON `launchpadReleaseRequests` (`status`);