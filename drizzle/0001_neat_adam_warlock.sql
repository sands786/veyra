CREATE TABLE `payrollSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`routeId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`timezone` varchar(80) NOT NULL DEFAULT 'UTC',
	`nextRunAt` timestamp NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payrollSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routeApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`routeId` int NOT NULL,
	`approverUserId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routeApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareableProofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`routeId` int NOT NULL,
	`slug` varchar(120) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `shareableProofs_id` PRIMARY KEY(`id`),
	CONSTRAINT `shareableProofs_slug_unique` UNIQUE(`slug`)
);
