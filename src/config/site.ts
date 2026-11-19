import { ROUTES } from "@/constants/routes";
import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  shortName: "IHS MedPortal",
  description:
    "Pharmacy Portal for medicine stores, clinics and hospital pharmacies — part of the Indian Health System platform.",
  url: env.NEXT_PUBLIC_MR_URL,
  ogImage: "/og.png",
  locale: "en_IN",
} as const;
