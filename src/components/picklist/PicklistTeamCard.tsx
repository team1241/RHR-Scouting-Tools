"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PicklistTeam } from "./types";

type PicklistTeamCardProps = {
  team: PicklistTeam;
  className?: string;
  dragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onRemove?: () => void;
  setNodeRef?: (element: HTMLElement | null) => void;
  style?: React.CSSProperties;
};

export default function PicklistTeamCard({
  team,
  className,
  dragging = false,
  dragHandleProps,
  onRemove,
  setNodeRef,
  style,
}: PicklistTeamCardProps) {
  const cardStyle = team.primaryColor
    ? { ...style, backgroundColor: team.primaryColor }
    : style;

  return (
    <Card
      ref={setNodeRef}
      style={cardStyle}
      className={cn(
        "group/team-card relative cursor-grab gap-1 rounded-xl bg-background p-2 shadow-none transition active:cursor-grabbing",
        onRemove && "pr-8",
        dragging && "opacity-60",
        className,
      )}
      {...dragHandleProps}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge variant="secondary">{team.teamNumber}</Badge>
            <p className="truncate text-xs font-semibold">{team.nameShort}</p>
          </div>
          {team.epaMean !== undefined ? (
            <p className="text-[11px] font-medium text-muted-foreground">
              EPA {team.epaMean.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          className="absolute right-1 top-1 opacity-0 transition-opacity group-hover/team-card:opacity-100 focus:opacity-100"
          aria-label={`Remove Team ${team.teamNumber} from column`}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          X
        </Button>
      ) : null}
    </Card>
  );
}
