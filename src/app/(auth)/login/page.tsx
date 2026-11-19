"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { FormContainer } from "@/components/forms/FormContainer";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      await login(values.email, values.password);
      toast.success("Logged in successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Login failed"));
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4" component="h1">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to the Medicine Portal
        </Typography>
      </Stack>

      <FormContainer methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <RHFTextField<LoginInput> name="email" label="Email" type="email" autoComplete="email" autoFocus />
          <RHFTextField<LoginInput>
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

          <Button type="submit" size="large" variant="contained" fullWidth>
            Sign in
          </Button>
        </Stack>
      </FormContainer>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Don&apos;t have an account?{" "}
        <MuiLink component={NextLink} href={ROUTES.REGISTER} sx={{ fontWeight: 600 }}>
          Register
        </MuiLink>
      </Typography>
    </Stack>
  );
}
