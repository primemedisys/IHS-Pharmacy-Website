"use client";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography variant="h4" color="error">
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
        <Button variant="contained" onClick={reset}>
          Try again
        </Button>
      </Stack>
    </Container>
  );
}
