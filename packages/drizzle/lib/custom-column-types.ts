import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { customType } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const dateFnsTzDate = customType<{
  data: TZDate;
  driverData: string;
  dataType: Date;
}>({
  dataType() {
    return 'text';
  },
  fromDriver(value: string): TZDate {
    // console.log('fromDriver', { value, type: typeof value });
    // return dbDateStringToLuxon(value);
    // const i = parse(value, 'yyyy:MM:dd HH:mm:ss', new Date());
    // console.log({ i });
    return new TZDate(value, 'UTC').withTimeZone('Asia/Manila');
  },
  toDriver(value: TZDate): string {
    // console.log('toDriver', { value, type: typeof value });
    const toDriver = format(value.withTimeZone('UTC'), 'yyyy-MM-dd HH:mm:ss');
    // console.log({ toDriver });
    return toDriver as string;
  },
});

export const dateFnsTzDateSchema = z.instanceof(TZDate);

export const numberArrayJson = customType<{
  data: NumberArrayType;
  driverData: string;
  dataType: Date;
}>({
  dataType() {
    return 'text';
  },
  fromDriver(value: string): NumberArrayType {
    return numberArrayJsonSchema.parse(JSON.parse(value));
  },
  toDriver(value: NumberArrayType): string {
    return JSON.stringify(value);
  },
});

export const numberArrayJsonSchema = z.array(z.number());
export type NumberArrayType = z.infer<typeof numberArrayJsonSchema>;
