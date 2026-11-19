"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormContainer } from "@/components/forms/FormContainer";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { medicineService } from "@/services/medicine.service";
import { getApiErrorMessage } from "@/utils/apiError";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(150, "Name is too long"),
});

type CategoryInput = z.infer<typeof categorySchema>;

export default function NewCategoryPage() {
  const router = useRouter();

  const methods = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: CategoryInput) => {
    try {
      const { category, created } = await medicineService.createCategory({ name: values.name });
      if (created) toast.success("Category created successfully");
      else toast.info(`"${category.name}" already exists — using the existing category`);
      router.push(ROUTES.CATEGORIES);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create category"));
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 500, mx: "auto" }}>
      <PageTitle title="Add Category" subtitle="Add a category to the shared list (existing names are reused, not duplicated)" />

      <Card variant="outlined">
        <CardContent>
          <FormContainer methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <RHFTextField<CategoryInput> name="name" label="Category Name" placeholder="e.g. Orthopedic Medicine" />

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" loading={methods.formState.isSubmitting}>
                  Create Category
                </Button>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </FormContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}
