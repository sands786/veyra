ALTER TABLE `blockchainTransactions` MODIFY COLUMN `network` enum('mainnet') NOT NULL;--> statement-breakpoint
ALTER TABLE `launchpadProjects` MODIFY COLUMN `network` enum('mainnet') NOT NULL DEFAULT 'mainnet';--> statement-breakpoint
ALTER TABLE `paymentRoutes` MODIFY COLUMN `network` enum('mainnet') NOT NULL DEFAULT 'mainnet';--> statement-breakpoint
ALTER TABLE `treasuryBalanceSnapshots` MODIFY COLUMN `network` enum('mainnet') NOT NULL;--> statement-breakpoint
ALTER TABLE `treasuryPolicies` MODIFY COLUMN `network` enum('mainnet') NOT NULL DEFAULT 'mainnet';--> statement-breakpoint
ALTER TABLE `workspaces` MODIFY COLUMN `network` enum('mainnet') NOT NULL DEFAULT 'mainnet';