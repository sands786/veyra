ALTER TABLE `paymentRoutes` ADD `clientRequestId` varchar(72);--> statement-breakpoint
ALTER TABLE `paymentRoutes` ADD COLUMN `clientRequestId` varchar(72);--> statement-breakpoint
ALTER TABLE `paymentRoutes` ADD CONSTRAINT `paymentRoutes_workspace_request_unique` UNIQUE(`workspaceId`,`clientRequestId`);
