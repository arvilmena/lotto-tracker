PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lotto_result` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lotto_id` text NOT NULL,
	`drawAt` text NOT NULL,
	`result` text NOT NULL,
	`jackpotPrize` integer,
	`winners` integer,
	FOREIGN KEY (`lotto_id`) REFERENCES `lotto`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lotto_result`("id", "lotto_id", "drawAt", "result", "jackpotPrize", "winners") SELECT "id", "lotto_id", "drawAt", "result", "jackpotPrize", "winners" FROM `lotto_result`;--> statement-breakpoint
DROP TABLE `lotto_result`;--> statement-breakpoint
ALTER TABLE `__new_lotto_result` RENAME TO `lotto_result`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `lottoResult_lottoId` ON `lotto_result` (`lotto_id`);--> statement-breakpoint
CREATE INDEX `lottoResult_drawAt` ON `lotto_result` (`drawAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResult_lottoId_drawAt` ON `lotto_result` (`lotto_id`,`drawAt`);--> statement-breakpoint
CREATE TABLE `__new_lotto_result__number` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lotto_result_id` integer NOT NULL,
	`number` integer NOT NULL,
	`order` integer NOT NULL,
	`lotto_id` text NOT NULL,
	`drawAt` text NOT NULL,
	FOREIGN KEY (`lotto_result_id`) REFERENCES `lotto_result`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lotto_id`) REFERENCES `lotto`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lotto_result__number`("id", "lotto_result_id", "number", "order", "lotto_id", "drawAt") SELECT "id", "lotto_result_id", "number", "order", "lotto_id", "drawAt" FROM `lotto_result__number`;--> statement-breakpoint
DROP TABLE `lotto_result__number`;--> statement-breakpoint
ALTER TABLE `__new_lotto_result__number` RENAME TO `lotto_result__number`;--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoResultId_number` ON `lotto_result__number` (`lotto_result_id`,`number`);--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoId` ON `lotto_result__number` (`lotto_id`);--> statement-breakpoint
CREATE INDEX `lottoResultNumber_lottoId_number` ON `lotto_result__number` (`lotto_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResultNumber_lottoResultId_number_order` ON `lotto_result__number` (`lotto_result_id`,`number`,`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `lottoResultNumber_lottoId_drawAt_number` ON `lotto_result__number` (`lotto_id`,`drawAt`,`number`);