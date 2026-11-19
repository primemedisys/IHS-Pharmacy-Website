"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccentTile } from "@/components/common/AccentTile";
import { FiPlus, FiSearch } from "react-icons/fi";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { medicineService } from "@/services/medicine.service";
import type { MedicineCategory } from "@/types";
import { toast } from "sonner";

/**
 * Categories are GLOBAL — every MR and Medicine Store shares one list. A
 * provider can search it and add a missing category (Add Category), but not
 * rename or delete one (that stays with the platform admin).
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await medicineService.listCategories(debouncedSearch);
        if (!cancelled) setCategories(result || []);
      } catch {
        if (!cancelled) toast.error("Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Categories"
        subtitle="Shared medicine categories used by all providers"
        actions={
          <Button
            component={Link}
            href={ROUTES.CATEGORY_NEW}
            variant="contained"
            startIcon={<FiPlus />}
          >
            Add Category
          </Button>
        }
      />

      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories..."
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch size={16} />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading ? (
        <Loading label="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="FiTag"
          title="No categories found"
          description={search ? "No category matches your search — add it if it is missing" : "Add the first category to organize medicines"}
          action={
            <Button component={Link} href={ROUTES.CATEGORY_NEW} variant="contained" startIcon={<FiPlus />}>
              Add Category
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {categories.map((cat) => (
            <Card key={cat.id} variant="outlined">
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", "&:last-child": { pb: 2 } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <AccentTile icon="FiTag" accent="teal" size={36} iconSize={18} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {cat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat.slug}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
