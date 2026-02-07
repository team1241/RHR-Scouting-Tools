"use client";

import { useEffect, useState } from "react";
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
import { Camera01Icon, Image03Icon } from "@hugeicons/core-free-icons";
import { useTeamImages } from "@/hooks/use-team-images";
import { TeamInMatch } from "@/lib/db/types";
import Link from "next/link";

type TeamMediaDialogProps = {
  allianceColour: "red" | "blue";
  teams: TeamInMatch[];
};

export default function TeamMediaDialog({
  teams,
  allianceColour,
}: TeamMediaDialogProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: images } = useTeamImages({
    teamNumbers: teams.map((team) => team.team.number),
  });

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
        {teams.length > 0 && (
          <Button variant="outline">
            <HugeiconsIcon icon={Camera01Icon} />
            Photos
          </Button>
        )}
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
            {teams.map((team) => {
              const imageUrls = images?.find(
                (image) => image.teamNumber === team.team.number,
              )?.imageUrls;
              return (
                <CarouselItem className="pl-0" key={team.team.number}>
                  <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-background">
                    {imageUrls && imageUrls.length > 0 ? (
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border bg-muted">
                        <div
                          className={cn(
                            "absolute left-2 top-2 z-10 rounded-md px-2 py-1 text-xs font-semibold text-white shadow",
                            allianceColour === "red"
                              ? "bg-red-600/90 ring-1 ring-red-500"
                              : "bg-blue-600/90 ring-1 ring-blue-500",
                          )}
                        >
                          {`${team.team.number} - ${team.team.name}`}
                        </div>
                        <Link
                          href={new URL(imageUrls[0])}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <div className="absolute right-2 top-2 z-10 rounded-md px-2 py-1 text-xs font-semibold text-white shadow flex flex-row gap-2 bg-emerald-600">
                            View full image{" "}
                            <HugeiconsIcon
                              icon={Image03Icon}
                              className="size-4"
                            />
                          </div>
                        </Link>
                        <Image
                          src={imageUrls[0]}
                          alt={`Image of team ${team.team.number}`}
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
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 bg-background/80 shadow ring-1 ring-border" />
          <CarouselNext className="right-3 top-1/2 -translate-y-1/2 bg-background/80 shadow ring-1 ring-border" />
        </Carousel>
        <DialogFooter className="flex flex-row flex-wrap gap-2 sm:justify-center">
          {teams.map((team, index) => {
            const imageUrls = images?.find(
              (image) => image.teamNumber === team.team.number,
            )?.imageUrls;
            return (
              <button
                key={`${team.team.number}-preview`}
                type="button"
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-md border transition",
                  selectedIndex === index
                    ? "ring-2 ring-primary"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                {imageUrls && imageUrls.length > 0 ? (
                  <Image
                    src={imageUrls[0]}
                    alt={`Preview ${index + 1} for team ${team.team.number}`}
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
            );
          })}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
