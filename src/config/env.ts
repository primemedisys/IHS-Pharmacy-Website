import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be set in .env to a valid URL"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Indian Health System - Medicine Portal"),
  NEXT_PUBLIC_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().default(""),
  // Google Maps JavaScript API key (public). Powers the Google Places location
  // search on MR / Medicine Store registration. Blank = the location field
  // falls back to a plain text input (graceful, like the other portals).
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().default(""),
  NEXT_PUBLIC_COOKIE_DOMAIN: z.string().default("localhost"),
  NEXT_PUBLIC_PATIENT_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_DOCTOR_URL: z.string().default("http://doctor.localhost:3001"),
  NEXT_PUBLIC_ADMIN_URL: z.string().default("http://admin.localhost:3002"),
  NEXT_PUBLIC_CLINIC_URL: z.string().default("http://clinic.localhost:3003"),
  NEXT_PUBLIC_MR_URL: z.string().default("http://localhost:3004"),
});

// Each NEXT_PUBLIC_* var must be referenced LITERALLY: Next.js only inlines
// `process.env.NEXT_PUBLIC_X` expressions into the browser bundle. Parsing the
// whole `process.env` object left the Maps key and API URL at their defaults in
// the built client (same explicit mapping the other portals use).
const parsed = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  NEXT_PUBLIC_PATIENT_URL: process.env.NEXT_PUBLIC_PATIENT_URL,
  NEXT_PUBLIC_DOCTOR_URL: process.env.NEXT_PUBLIC_DOCTOR_URL,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  NEXT_PUBLIC_CLINIC_URL: process.env.NEXT_PUBLIC_CLINIC_URL,
  NEXT_PUBLIC_MR_URL: process.env.NEXT_PUBLIC_MR_URL,
});

export const env = {
  ...parsed,
  googleMapsApiKey: parsed.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  /** True when a Maps API key is configured (drives whether live Google search renders). */
  isMapsEnabled: parsed.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.length > 0,
} as const;
