CREATE TABLE `launchpadAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`commitment` varchar(255) NOT NULL,
	`encryptedReference` text,
	`allocationAmount` varchar(80) NOT NULL,
	`status` enum('reserved','claimed','revoked') NOT NULL DEFAULT 'reserved',
	`claimedWalletAddress` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`claimedAt` timestamp,
	CONSTRAINT `launchpadAllocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `launchpadAllocations_commitment_unique` UNIQUE(`commitment`)
);
--> statement-breakpoint
CREATE TABLE `launchpadMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`sequence` int NOT NULL DEFAULT 1,
	`releaseAmount` varchar(80) NOT NULL,
	`approvalThreshold` int NOT NULL DEFAULT 1,
	`status` enum('planned','ready','released','blocked') NOT NULL DEFAULT 'planned',
	`proofReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launchpadMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launchpadProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` text,
	`token` varchar(80) NOT NULL,
	`network` enum('mainnet','sepolia') NOT NULL DEFAULT 'mainnet',
	`targetAmount` varchar(80) NOT NULL,
	`raisedAmount` varchar(80) NOT NULL DEFAULT '0',
	`privacyMode` enum('shielded','public') NOT NULL DEFAULT 'shielded',
	`status` enum('draft','live','funded','closed') NOT NULL DEFAULT 'draft',
	`fundingEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launchpadProjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `launchpadProjects_slug_unique` UNIQUE(`slug`)
);
