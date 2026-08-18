CREATE TABLE `privateMarketAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`marketId` int,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`code` varchar(80) NOT NULL,
	`message` varchar(500) NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	CONSTRAINT `privateMarketAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `privateMarketAlerts_workspace_idx` ON `privateMarketAlerts` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `privateMarketAlerts_status_idx` ON `privateMarketAlerts` (`status`);--> statement-breakpoint
CREATE INDEX `privateMarketAlerts_market_idx` ON `privateMarketAlerts` (`marketId`);