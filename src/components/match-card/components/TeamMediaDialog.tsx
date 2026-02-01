"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon } from "@hugeicons/core-free-icons";

type TeamMediaDialogProps = {
  allianceColour: "red" | "blue";
  teams: Array<{
    teamNumber: number | string;
    teamName: string;
    imageUrl: string | null;
  }>;
};

export default function TeamMediaDialog({
  teams,
  allianceColour,
}: TeamMediaDialogProps) {
  const displayTeams = useMemo(() => teams.slice(0, 3), [teams]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setSelectedIndex(api.selectedScrollSnap());

    handleSelect();
    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={Camera01Icon} />
          Photos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="min-h-fit">
          <DialogTitle asChild>
            <span className="">
              {allianceColour === "red"
                ? "Red Alliance Photos"
                : "Blue Alliance Photos"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <Carousel
          className="w-full"
          setApi={(nextApi) => setApi(nextApi)}
          opts={{ loop: true }}
        >
          <CarouselContent className="ml-0">
            {displayTeams.map((team) => (
              <CarouselItem className="pl-0" key={team.teamNumber}>
                <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-background p-3">
                  {team.imageUrl ? (
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={team.imageUrl}
                        alt={`Team ${team.teamNumber} ${team.teamName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 90vw, 840px"
                      />
                    </div>
                  ) : (
                    <Empty className="min-h-65">
                      <EmptyHeader>
                        <EmptyTitle>No image yet</EmptyTitle>
                        <EmptyDescription>
                          Add a match photo to see it here.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 bg-background/80 shadow ring-1 ring-border" />
          <CarouselNext className="right-3 top-1/2 -translate-y-1/2 bg-background/80 shadow ring-1 ring-border" />
        </Carousel>
        <DialogFooter className="flex flex-row flex-wrap gap-2 sm:justify-center">
          {displayTeams.map((team, index) => (
            <button
              key={`${team.teamNumber}-preview`}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "relative h-16 w-24 overflow-hidden rounded-md border transition",
                selectedIndex === index
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              {team.imageUrl ? (
                <Image
                  src={team.imageUrl}
                  alt={`Preview ${index + 1} for team ${team.teamNumber}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-semibold text-muted-foreground">
                  No image
                </div>
              )}
            </button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
