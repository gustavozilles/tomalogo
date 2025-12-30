import { z } from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is missing"),
    GEMINI_API_KEY: z.string().optional(),
    PUBLIC_URL: z.string().optional().default("135.181.97.102"),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Twilio (Optional but recommended to validate if used)
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
})

// Validate `process.env` against the schema
// This will throw a clear error if critical keys are missing
export const env = envSchema.parse(process.env)
