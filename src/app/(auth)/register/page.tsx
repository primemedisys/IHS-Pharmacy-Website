"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import NextLink from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { FormContainer } from "@/components/forms/FormContainer";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { ProviderLocationAutocomplete, type ProviderLocation } from "@/components/maps/ProviderLocationAutocomplete";
import { ROUTES } from "@/constants/routes";
import { isDiagnosticLab, roleLabel } from "@/features/dashboard/nav";
import { useAuth } from "@/hooks/useAuth";
import type { RegisterableProviderType } from "@/types";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

/**
 * The provider types a new provider can register as: the two pharmacy types,
 * then Diagnostic Lab Center. Medicine Representative is retired and
 * deliberately absent (the backend rejects it too); existing MR accounts still
 * sign in normally.
 */
const PROVIDER_TYPES: RegisterableProviderType[] = ["medicine_store", "pharmacy_hospital", "diagnostic_lab"];

const NAME_PLACEHOLDER: Record<RegisterableProviderType, string> = {
  medicine_store: "Health Pharmacy",
  pharmacy_hospital: "XYZ Hospital Pharmacy",
  diagnostic_lab: "ABC Diagnostic Center",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const [providerType, setProviderType] = useState<RegisterableProviderType>("medicine_store");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<ProviderLocation | null>(null);
  const [locationError, setLocationError] = useState(false);
  // Three provider types don't fit side by side on a phone — stack them there.
  const stackToggles = useMediaQuery((t: Theme) => t.breakpoints.down("sm"));
  const isLab = isDiagnosticLab(providerType);

  const methods = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    if (!location) {
      setLocationError(true);
      return;
    }
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role: providerType,
        addressLine: location.addressLine || undefined,
        city: location.city || undefined,
        state: location.state || undefined,
        pincode: location.pincode || undefined,
        lat: location.lat ?? undefined,
        lng: location.lng ?? undefined,
      });
      toast.success("Registered successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4" component="h1">
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isLab
            ? "Join the Indian Health System as a Diagnostic Lab Center"
            : "Join the Indian Health System Medicine Portal"}
        </Typography>
      </Stack>

      <ToggleButtonGroup
        value={providerType}
        exclusive
        orientation={stackToggles ? "vertical" : "horizontal"}
        onChange={(_, v) => v && setProviderType(v)}
        fullWidth
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 600,
            py: 1.25,
          },
        }}
      >
        {PROVIDER_TYPES.map((type) => (
          <ToggleButton key={type} value={type}>
            {roleLabel[type]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <FormContainer methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <ProviderLocationAutocomplete
            value={location}
            onChange={(loc) => {
              setLocation(loc);
              if (loc) setLocationError(false);
            }}
            required
            label="Location"
            error={locationError}
            helperText={locationError ? "Please select your location from the Google dropdown" : undefined}
          />
          <RHFTextField<RegisterInput> name="name" label={isLab ? "Lab / Centre Name" : "Pharmacy Name"} autoFocus placeholder={NAME_PLACEHOLDER[providerType]} />
          <RHFTextField<RegisterInput> name="email" label="Email" type="email" autoComplete="email" />
          <RHFTextField<RegisterInput> name="phone" label="Phone (optional)" type="tel" />
          <RHFTextField<RegisterInput>
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            helperText="At least 8 characters"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <RHFTextField<RegisterInput> name="confirmPassword" label="Confirm Password" type="password" />

          <Button type="submit" size="large" variant="contained" fullWidth>
            Create account
          </Button>
        </Stack>
      </FormContainer>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Already have an account?{" "}
        <MuiLink component={NextLink} href={ROUTES.LOGIN} sx={{ fontWeight: 600 }}>
          Sign in
        </MuiLink>
      </Typography>
    </Stack>
  );
}
