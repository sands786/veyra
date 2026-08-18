CREATE TABLE `privateMarketQuotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`providerLabel` varchar(160) NOT NULL,
	`price` varchar(80) NOT NULL,
	`feeBps` int NOT NULL DEFAULT 0,
	`capacity` varchar(80) NOT NULL,
	`status` enum('open','accepted','expired','rejected') NOT NULL DEFAULT 'open',
	`expiresAt` timestamp NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privateMarketQuotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privateMarketRiskPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`marketId` int,
	`maxBidAmount` varchar(80) NOT NULL,
	`maxConcentrationPct` int NOT NULL DEFAULT 25,
	`approvalThreshold` int NOT NULL DEFAULT 1,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privateMarketRiskPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `privateMarketQuotes_market_idx` ON `privateMarketQuotes` (`marketId`);--> statement-breakpoint
CREATE INDEX `privateMarketQuotes_status_idx` ON `privateMarketQuotes` (`status`);--> statement-breakpoint
CREATE INDEX `privateMarketRiskPolicies_workspace_idx` ON `privateMarketRiskPolicies` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `privateMarketRiskPolicies_market_idx` ON `privateMarketRiskPolicies` (`marketId`);