CREATE TABLE `localAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `localAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_accounts_user_unique` UNIQUE(`userId`),
	CONSTRAINT `local_accounts_email_unique` UNIQUE(`email`)
);
