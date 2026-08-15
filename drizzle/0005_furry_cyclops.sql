CREATE TABLE `claimLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`routeId` int NOT NULL,
	`recipientId` int NOT NULL,
	`token` varchar(80) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('pending','claimed','revoked') NOT NULL DEFAULT 'pending',
	`claimedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `claimLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `claimLinks_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `treasuryPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`token` varchar(80) NOT NULL,
	`network` enum('mainnet','sepolia') NOT NULL DEFAULT 'mainnet',
	`maxRouteAmount` varchar(80) NOT NULL,
	`dailyLimit` varchar(80) NOT NULL,
	`approvalThreshold` int NOT NULL DEFAULT 1,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treasuryPolicies_id` PRIMARY KEY(`id`)
);
