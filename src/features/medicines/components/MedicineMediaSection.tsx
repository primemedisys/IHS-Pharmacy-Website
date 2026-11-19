"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { medicineService } from "@/services/medicine.service";
import type { MedicineMedia, SubstituteMaster } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { ImageSlots } from "./ImageSlots";
import { SubstitutePicker } from "./SubstitutePicker";

const sameIds = (a: SubstituteMaster[], b: SubstituteMaster[]) =>
  a.length === b.length && a.every((m, i) => m.id === b[i].id);

/**
 * Edit-page card for a medicine's shared images and substitutes. Unlike the
 * inventory form above it, changes apply immediately: an image uploads as
 * soon as it is picked, and substitutes save with their own button. Both are
 * stored on the GLOBAL medicine, so every pharmacy selling it sees the same.
 */
export function MedicineMediaSection({ masterId }: { masterId: number }) {
  const [media, setMedia] = useState<MedicineMedia | null>(null);
  const [substitutes, setSubstitutes] = useState<SubstituteMaster[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    medicineService
      .getMedia(masterId)
      .then((m) => {
        if (cancelled) return;
        setMedia(m);
        setSubstitutes(m.substitutes);
      })
      .catch((err) => !cancelled && toast.error(getApiErrorMessage(err, "Failed to load images")));
    return () => {
      cancelled = true;
    };
  }, [masterId]);

  const upload = async (files: File[]) => {
    setUploading(true);
    try {
      // One request per file keeps each failure attributable to its file.
      for (const file of files) {
        try {
          setMedia(await medicineService.uploadImage(masterId, file));
        } catch (err) {
          toast.error(`${file.name}: ${getApiErrorMessage(err, "upload failed")}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const remove = async (key: string) => {
    try {
      setMedia(await medicineService.removeImage(masterId, Number(key)));
      toast.success("Image removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove image"));
    }
  };

  const promote = async (key: string) => {
    if (!media) return;
    const ids = media.images.map((i) => i.id);
    const id = Number(key);
    try {
      setMedia(await medicineService.reorderImages(masterId, [id, ...ids.filter((x) => x !== id)]));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reorder images"));
    }
  };

  const saveSubstitutes = async () => {
    setSaving(true);
    try {
      const next = await medicineService.setSubstitutes(masterId, substitutes.map((s) => s.id));
      setMedia(next);
      setSubstitutes(next.substitutes);
      toast.success("Substitute medicines saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save substitutes"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Images & Substitutes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shared by every pharmacy that sells this medicine. Changes here are saved immediately.
            </Typography>
          </Stack>

          {!media ? (
            <Stack direction="row" spacing={1.5}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={132} height={132} />
              ))}
            </Stack>
          ) : (
            <>
              {!media.canEdit && (
                <Alert severity="info">Only pharmacies currently selling this medicine can change its images and substitutes.</Alert>
              )}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Medicine Images
                </Typography>
                <ImageSlots
                  slots={media.images.map((img) => ({
                    key: String(img.id),
                    url: img.imageUrl,
                    removable: img.canDelete,
                    canPromote: media.canEdit,
                  }))}
                  max={media.maxImages}
                  busy={uploading}
                  disabled={!media.canEdit}
                  onAdd={upload}
                  onRemove={remove}
                  onPromote={promote}
                />
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Substitute Medicines
                </Typography>
                <SubstitutePicker
                  value={substitutes}
                  onChange={setSubstitutes}
                  excludeId={masterId}
                  max={media.maxSubstitutes}
                  disabled={!media.canEdit}
                />
                <Button
                  variant="outlined"
                  onClick={saveSubstitutes}
                  loading={saving}
                  disabled={!media.canEdit || sameIds(substitutes, media.substitutes)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Save Substitutes
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
