CREATE TABLE `lotto_result__number` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lotto_result_id` text NOT NULL,
	`number` integer NOT NULL,
	`order` integer NOT NULL,
	`lotto_id` text NOT NULL,
	`drawAt` text NOT NULL,
	FOREIGN KEY (`lotto_result_id`) REFERENCES `lotto_result`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lotto_id`) REFERENCES `lotto`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoResultId_number` ON `lotto_result__number` (`lotto_result_id`,`number`);--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoId` ON `lotto_result__number` (`lotto_id`);--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoId_number` ON `lotto_result__number` (`lotto_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResultNumber_lottoResultId_number_order` ON `lotto_result__number` (`lotto_result_id`,`number`,`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResultNumber_lottoId_drawAt_number` ON `lotto_result__number` (`lotto_id`,`drawAt`,`number`);