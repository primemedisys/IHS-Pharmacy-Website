"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { env } from "@/config/env";

/**
 * The structured location a provider registers: the Google-formatted display
 * label plus the split city/state/pincode/coordinates that the platform's
 * other portals store for clinics. No placeId is persisted anywhere in the
 * platform — the existing convention is addressLine/city/state/pincode/lat/lng.
 */
export interface ProviderLocation {
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

export interface ProviderLocationAutocompleteProps {
  value: ProviderLocation | null;
  onChange: (loc: ProviderLocation | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  placeholder?: string;
}

const MAPS_LIBRARIES = ["places"];
/** users.address_line is VARCHAR(255) — cap client-side like the other portals. */
const MAX_LEN = 255;
const PLACEHOLDER = "Search Google location, e.g. Bhubaneswar, Odisha";

/** Pull one component out of a Google result by its type tag. */
function component(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false,
): string {
  const hit = components.find((c) => c.types.includes(type));
  return hit ? (short ? hit.short_name : hit.long_name) : "";
}

/** Split a Google result into the platform's stored location columns. */
function toProviderLocation(place: google.maps.GeocoderResult): ProviderLocation {
  const c = place.address_components ?? [];
  const street = [
    component(c, "premise"),
    component(c, "street_number"),
    component(c, "route"),
    component(c, "sublocality_level_2"),
    component(c, "sublocality_level_1") || component(c, "sublocality"),
    component(c, "neighborhood"),
  ]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i)
    .join(", ");

  const city =
    component(c, "locality") ||
    component(c, "administrative_area_level_3") ||
    component(c, "administrative_area_level_2");

  return {
    label: (place.formatted_address || "").slice(0, MAX_LEN),
    addressLine: (street || place.formatted_address || "").slice(0, MAX_LEN),
    city: city.slice(0, 100),
    state: component(c, "administrative_area_level_1").slice(0, 100),
    pincode: component(c, "postal_code").slice(0, 20),
    lat: place.geometry?.location ? place.geometry.location.lat() : null,
    lng: place.geometry?.location ? place.geometry.location.lng() : null,
  };
}

function Search({ value, onChange, required, error, helperText, label = "Location", placeholder = PLACEHOLDER }: ProviderLocationAutocompleteProps) {
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const autocompleteService = useMemo(() => (placesLib ? new placesLib.AutocompleteService() : null), [placesLib]);
  const geocoder = useMemo(() => (geocodingLib ? new geocodingLib.Geocoder() : null), [geocodingLib]);

  const [input, setInput] = useState(value?.label ?? "");
  const [options, setOptions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Google Places predictions as the user types (India-restricted).
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!autocompleteService) return;
    debounce.current = setTimeout(() => {
      const q = input.trim();
      if (q.length < 3) {
        setOptions([]);
        return;
      }
      setLoading(true);
      autocompleteService.getPlacePredictions({ input: q, componentRestrictions: { country: "in" } }, (predictions) => {
        setOptions(predictions ?? []);
        setLoading(false);
      });
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [input, autocompleteService]);

  /** Turn a chosen prediction / coordinates into the structured location. */
  const resolvePlace = (request: google.maps.GeocoderRequest) => {
    if (!geocoder) return;
    geocoder.geocode(request, (results, status) => {
      if (status === "OK" && results?.[0]) {
        onChange(toProviderLocation(results[0]));
        setInput(results[0].formatted_address.slice(0, MAX_LEN));
      }
    });
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation || !geocoder) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolvePlace({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <Stack spacing={0.75}>
      <Autocomplete<google.maps.places.AutocompletePrediction, false, false, true>
        freeSolo
        fullWidth
        filterOptions={(x) => x}
        options={options}
        loading={loading}
        inputValue={input}
        onInputChange={(_e, v) => {
          setInput(v.slice(0, MAX_LEN));
          if (!v.trim()) onChange(null);
        }}
        getOptionLabel={(o) => (typeof o === "string" ? o : o.description)}
        noOptionsText={input.trim().length < 3 ? "Type a place to search" : "No matches"}
        loadingText="Searching Google…"
        onChange={(_e, option) => {
          if (option && typeof option !== "string") {
            resolvePlace({ placeId: option.place_id });
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            helperText={helperText}
          />
        )}
      />
      <Button
        size="small"
        onClick={useCurrentLocation}
        disabled={locating || !geocoder}
        startIcon={<FiMapPin size={14} />}
        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
      >
        {locating ? "Locating…" : "Use my current location"}
      </Button>
    </Stack>
  );
}

/** No Maps key configured → a plain required text field (graceful fallback). */
export default function ProviderLocationAutocompleteInner(props: ProviderLocationAutocompleteProps) {
  if (!env.isMapsEnabled) {
    return (
      <TextField
        label={props.label ?? "Location"}
        placeholder={props.placeholder ?? PLACEHOLDER}
        value={props.value?.label ?? ""}
        onChange={(e) => {
          const v = e.target.value.slice(0, MAX_LEN);
          props.onChange(v ? { label: v, addressLine: v, city: "", state: "", pincode: "", lat: null, lng: null } : null);
        }}
        required={props.required}
        error={props.error}
        helperText={props.helperText}
        fullWidth
      />
    );
  }
  return (
    <APIProvider apiKey={env.googleMapsApiKey} libraries={MAPS_LIBRARIES}>
      <Search {...props} />
    </APIProvider>
  );
}