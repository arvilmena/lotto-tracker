CREATE TABLE `lotto` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pcsoId` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lotto_pcsoId` ON `lotto` (`pcsoId`);--> statement-breakpoint
CREATE TABLE `lotto_result` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lotto_id` text NOT NULL,
	`drawAt` text NOT NULL,
	`result` text,
	`jackpotPrize` integer,
	`winners` integer,
	FOREIGN KEY (`lotto_id`) REFERENCES `lotto`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lottoResult_lottoId` ON `lotto_result` (`lotto_id`);--> statement-breakpoint
CREATE INDEX `lottoResult_drawAt` ON `lotto_result` (`drawAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResult_lottoId_drawAt` ON `lotto_result` (`lotto_id`,`drawAt`);--> statement-breakpoint
CREATE TABLE `lotto_result__number` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lotto_result_id` text NOT NULL,
	`number` integer NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`lotto_result_id`) REFERENCES `lotto_result`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoResultId_number` ON `lotto_result__number` (`lotto_result_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResultNumber_lottoResultId_number_order` ON `lotto_result__number` (`lotto_result_id`,`number`,`order`);