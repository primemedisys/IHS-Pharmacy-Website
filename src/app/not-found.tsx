import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography variant="h1" color="text.disabled">
          404
        </Typography>
        <Typography variant="h5" color="text.primary">
          Page not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The page you are looking for does not exist or has been moved.
        </Typography>
      </Stack>
    </Container>
  );
}
