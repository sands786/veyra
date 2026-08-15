CREATE TABLE `treasuryBalanceSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(80) NOT NULL,
	`network` enum('mainnet','sepolia') NOT NULL,
	`availableBalance` varchar(80) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'wallet_read',
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasuryBalanceSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `claimLinks` ADD `claimedWalletAddress` varchar(80);