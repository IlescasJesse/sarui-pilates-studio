import { z } from 'zod';

export const checkInSchema = z
  .union([
    z.object({
      qrCode: z.string().min(1, 'QR code cannot be empty'),
      pin: z.undefined(),
    }),
    z.object({
      pin: z
        .string()
        .length(4, 'PIN must be exactly 4 digits')
        .regex(/^\d{4}$/, 'PIN must contain only digits'),
      qrCode: z.undefined(),
    }),
  ])
  .refine(
    (data) => data.qrCode !== undefined || data.pin !== undefined,
    { message: 'Either qrCode or pin must be provided' }
  );

export type CheckInInput = z.infer<typeof checkInSchema>;
