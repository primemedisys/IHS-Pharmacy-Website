"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useRef } from "react";
import { FiImage, FiPlus, FiStar, FiX } from "react-icons/fi";
import { toast } from "sonner";

/** Mirrors the backend: any image except SVG, at most MAX_UPLOAD_MB (5 MB in .env). */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif";

export interface ImageSlot {
  key: string;
  url: string;
  /** Show the remove (×) button. */
  removable?: boolean;
  /** Show "Make primary" (only in live mode, for images already saved). */
  canPromote?: boolean;
}

interface ImageSlotsProps {
  slots: ImageSlot[];
  max: number;
  busy?: boolean;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove?: (key: string) => void;
  onPromote?: (key: string) => void;
}

/**
 * Up to `max` medicine image thumbnails plus an "add" tile. Purely
 * presentational: the parent decides whether a picked file is kept as a
 * pending preview (new medicine) or uploaded straight away (edit page).
 * The first slot is the primary image shown on patient cards.
 */
export function ImageSlots({ slots, max, busy, disabled, onAdd, onRemove, onPromote }: ImageSlotsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const free = Math.max(0, max - slots.length);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/") || f.type === "image/svg+xml") {
        toast.error(`${f.name}: only PNG, JPEG or WebP images can be uploaded`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: image is larger than 5 MB`);
        return false;
      }
      return true;
    });
    if (valid.length > free) toast.warning(`Only ${free} more image${free === 1 ? "" : "s"} can be added (max ${max})`);
    if (valid.length && free) onAdd(valid.slice(0, free));
    if (inputRef.current) inputRef.current.value = "";
  };

  const tile = { width: { xs: "calc(50% - 6px)", sm: 132 }, aspectRatio: "1 / 1" } as const;

  return (
    <Stack spacing={1}>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1.5 }}>
        {slots.map((s, i) => (
          <Box
            key={s.key}
            sx={{
              ...tile,
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              border: 1,
              borderColor: i === 0 ? "primary.main" : "divider",
              bgcolor: "background.default",
            }}
          >
            <Box
              component="img"
              src={s.url}
              alt={`Medicine image ${i + 1}`}
              sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
            {i === 0 && (
              <Box
                sx={{
                  position: "absolute",
                  left: 6,
                  bottom: 6,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "primary.contrastText",
                  bgcolor: "primary.main",
                }}
              >
                Primary
              </Box>
            )}
            <Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 4, right: 4 }}>
              {s.canPromote && i > 0 && onPromote && (
                <Tooltip title="Make primary">
                  <IconButton
                    size="small"
                    aria-label={`Make image ${i + 1} primary`}
                    disabled={busy || disabled}
                    onClick={() => onPromote(s.key)}
                    sx={{ bgcolor: (t) => alpha(t.palette.background.paper, 0.9), "&:hover": { bgcolor: "background.paper" } }}
                  >
                    <FiStar size={14} />
                  </IconButton>
                </Tooltip>
              )}
              {s.removable && onRemove && (
                <Tooltip title="Remove image">
                  <IconButton
                    size="small"
                    aria-label={`Remove image ${i + 1}`}
                    disabled={busy || disabled}
                    onClick={() => onRemove(s.key)}
                    sx={{ bgcolor: (t) => alpha(t.palette.background.paper, 0.9), "&:hover": { bgcolor: "background.paper" } }}
                  >
                    <FiX size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ))}

        {free > 0 && (
          <ButtonBase
            onClick={() => inputRef.current?.click()}
            disabled={busy || disabled}
            aria-label="Add medicine images"
            sx={{
              ...tile,
              flexDirection: "column",
              gap: 0.75,
              borderRadius: 2,
              border: "1.5px dashed",
              borderColor: "divider",
              color: "text.secondary",
              transition: (t) => t.transitions.create(["border-color", "color", "background-color"]),
              "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "grey.50" },
              "&.Mui-focusVisible": { borderColor: "primary.main" },
            }}
          >
            {busy ? <CircularProgress size={22} /> : slots.length ? <FiPlus size={22} /> : <FiImage size={22} />}
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {busy ? "Uploading…" : "Add image"}
            </Typography>
          </ButtonBase>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {slots.length}/{max} images · PNG, JPEG or WebP up to 5 MB · the first image is shown on medicine cards
      </Typography>
      <input ref={inputRef} type="file" hidden multiple accept={ACCEPT} onChange={(e) => pick(e.target.files)} />
    </Stack>
  );
}
