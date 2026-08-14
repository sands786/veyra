CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`action` varchar(80) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockchainTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`network` enum('mainnet','sepolia') NOT NULL,
	`transactionHash` varchar(100) NOT NULL,
	`status` enum('submitted','confirmed','reverted','unknown') NOT NULL DEFAULT 'submitted',
	`explorerUrl` varchar(255),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `blockchainTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `blockchainTransactions_transactionHash_unique` UNIQUE(`transactionHash`)
);
--> statement-breakpoint
CREATE TABLE `paymentRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`token` varchar(80) NOT NULL,
	`totalAmount` varchar(80) NOT NULL,
	`privacyMode` enum('shielded','public') NOT NULL DEFAULT 'shielded',
	`status` enum('draft','shielded','routed','settled','failed','cancelled') NOT NULL DEFAULT 'draft',
	`proofReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentRoutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`walletAddress` varchar(100) NOT NULL,
	`note` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routeRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`recipientId` int NOT NULL,
	`amount` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routeRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','operator','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`ownerUserId` int NOT NULL,
	`defaultToken` varchar(80) NOT NULL DEFAULT 'USDC',
	`network` enum('mainnet','sepolia') NOT NULL DEFAULT 'mainnet',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
