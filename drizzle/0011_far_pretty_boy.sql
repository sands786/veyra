CREATE TABLE `privateMarketBids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`bidderUserId` int NOT NULL,
	`commitmentHash` varchar(255) NOT NULL,
	`encryptedTerms` text,
	`bidAmount` varchar(80) NOT NULL,
	`status` enum('committed','revealed','accepted','rejected') NOT NULL DEFAULT 'committed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revealedAt` timestamp,
	CONSTRAINT `privateMarketBids_id` PRIMARY KEY(`id`),
	CONSTRAINT `privateMarketBids_commitmentHash_unique` UNIQUE(`commitmentHash`)
);
--> statement-breakpoint
CREATE TABLE `privateMarkets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`token` varchar(80) NOT NULL,
	`network` enum('mainnet','sepolia') NOT NULL DEFAULT 'sepolia',
	`targetAmount` varchar(80) NOT NULL,
	`currentPrice` varchar(80) NOT NULL DEFAULT '0',
	`publicVolume` varchar(80) NOT NULL DEFAULT '0',
	`publicParticipants` int NOT NULL DEFAULT 0,
	`status` enum('draft','live','closed') NOT NULL DEFAULT 'draft',
	`bidDeadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privateMarkets_id` PRIMARY KEY(`id`),
	CONSTRAINT `privateMarkets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `privateMarketBids_market_idx` ON `privateMarketBids` (`marketId`);--> statement-breakpoint
CREATE INDEX `privateMarketBids_bidder_idx` ON `privateMarketBids` (`bidderUserId`);