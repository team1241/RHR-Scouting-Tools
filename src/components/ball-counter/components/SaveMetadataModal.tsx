"use client";

import { api } from "@/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MetadataFormValues,
  metadataSchema,
} from "../schemas/create-metadata.schema";
import useCycleTracking from "@/components/ball-counter/hooks/useCycleTracking";
import type { Cycle } from "@/components/ball-counter/types";
import { useUser } from "@clerk/nextjs";

type SaveMetadataModalProps = {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
};

export default function SaveMetadataModal({
  isOpen,
  onClose,
  videoUrl,
}: SaveMetadataModalProps) {
  const saveBallCountingData = useMutation(api.ballCounter.saveData);

  const { cycles } = useCycleTracking();

  const { user } = useUser();

  const form = useForm<MetadataFormValues>({
    defaultValues: {
      userName: user?.fullName ?? "",
      eventCode: "",
      matchNumber: "",
      teamNumber: "",
    },
    validators: {
      onChange: metadataSchema,
    },
    onSubmit: async ({ value }) => {
      const trimmedUrl = videoUrl.trim();
      try {
        const cyclePayload: Cycle[] = cycles.map((cycle, index) => {
          const duration = Math.max(
            0,
            cycle.endTimestamp - cycle.startTimestamp,
          );
          const bps = duration > 0 ? cycle.numberOfBalls / duration : 0;
          return {
            cycleNumber: index + 1,
            startTimestamp: cycle.startTimestamp,
            endTimestamp: cycle.endTimestamp,
            numberOfBalls: cycle.numberOfBalls,
            cycleType: cycle.shotType,
            bps,
          };
        });
        const { totalBalls, totalDuration } = cycles.reduce(
          (acc, cycle) => {
            const duration = Math.max(
              0,
              cycle.endTimestamp - cycle.startTimestamp,
            );
            if (duration <= 0) return acc;
            acc.totalBalls += cycle.numberOfBalls;
            acc.totalDuration += duration;
            return acc;
          },
          { totalBalls: 0, totalDuration: 0 },
        );
        const overallBps = totalDuration > 0 ? totalBalls / totalDuration : 0;
        await saveBallCountingData({
          metadata: {
            userName: value.userName,
            eventCode: value.eventCode,
            matchNumber: value.matchNumber,
            teamNumber: Number(value.teamNumber),
            videoUrl: trimmedUrl,
            bps: overallBps,
          },
          cycles: cyclePayload,
        });
        form.reset();
        onClose();
        toast.success(
          `Successfully saved data for Team ${value.teamNumber} - ${value.eventCode} Match ${value.matchNumber}`,
        );
      } catch {
        toast.error("Unable to save metadata. Try again.");
      }
    },
  });
  console.log("🚀 ~ SaveMetadataModal ~ form:", form.getFieldValue("userName"));

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [form, isOpen]);

  if (!isOpen) return null;

  const isSubmitting = form.state.isSubmitting;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-foreground">
              Save match metadata
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture event, match, and team details alongside this clip.
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full border border-transparent text-muted-foreground transition hover:border-border hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="eventCode">
            {(field) => {
              const fieldError = field.state.meta.isTouched
                ? field.state.meta.errors?.[0]
                : undefined;
              const inputId = `${field.name}-input`;
              return (
                <div className="space-y-2">
                  <Label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-foreground"
                  >
                    Event code
                  </Label>
                  <Input
                    id={inputId}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="ex: 2025onbar"
                  />
                  {fieldError ? (
                    <span className="block text-xs text-destructive">
                      {fieldError}
                    </span>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="matchNumber">
            {(field) => {
              const fieldError = field.state.meta.isTouched
                ? field.state.meta.errors?.[0]
                : undefined;
              const inputId = `${field.name}-input`;
              return (
                <div className="space-y-2">
                  <Label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-foreground"
                  >
                    Match number
                  </Label>
                  <Input
                    id={inputId}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="ex: Q42"
                  />
                  {fieldError ? (
                    <span className="block text-xs text-destructive">
                      {fieldError}
                    </span>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="teamNumber">
            {(field) => {
              const fieldError = field.state.meta.isTouched
                ? field.state.meta.errors?.[0]
                : undefined;
              const inputId = `${field.name}-input`;
              return (
                <div className="space-y-2">
                  <Label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-foreground"
                  >
                    Team number
                  </Label>
                  <Input
                    id={inputId}
                    type="number"
                    inputMode="numeric"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="ex: 4334"
                  />
                  {fieldError ? (
                    <span className="block text-xs text-destructive">
                      {fieldError}
                    </span>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button type="button" onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save data"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
