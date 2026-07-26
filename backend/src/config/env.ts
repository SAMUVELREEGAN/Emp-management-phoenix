import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OFFICE_START_TIME: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'OFFICE_START_TIME must be HH:mm')
    .default('09:30'),
  OFFICE_END_TIME: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'OFFICE_END_TIME must be HH:mm')
    .default('18:00'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMS_DEFAULT_COUNTRY_CODE: z.string().default('91'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  /** osm = OpenStreetMap only, google = Google only, auto = Google then OSM fallback */
  GEOCODING_PROVIDER: z.enum(['osm', 'google', 'auto']).optional(),
  /** One-time demo reset on startup. Set to true in Render, redeploy, then remove. */
  RESET_DEMO_DATA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
