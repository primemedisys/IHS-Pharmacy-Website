"use client";

import Skeleton from "@mui/material/Skeleton";
import dynamic from "next/dynamic";
import type { ProviderLocationAutocompleteProps } from "./ProviderLocationAutocompleteInner";

/**
 * Client-only wrapper for the Google Maps location field, reusing the exact
 * pattern the patient/doctor/clinic portals use (dynamic import with
 * `ssr: false` so the browser-only Maps API never runs on the server).
 */
const Inner = dynamic(() => import("./ProviderLocationAutocompleteInner"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" sx={{ width: "100%", height: 56 }} />,
});

export function ProviderLocationAutocomplete(props: ProviderLocationAutocompleteProps) {
  return <Inner {...props} />;
}

export type { ProviderLocationAutocompleteProps, ProviderLocation } from "./ProviderLocationAutocompleteInner";