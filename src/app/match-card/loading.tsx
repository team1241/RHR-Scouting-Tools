import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-4 min-h-screen pb-12 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="flex w-full flex-col gap-4 rounded-xl border bg-white/80 p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid gap-2 md:grid-cols-12">
          <Skeleton className="col-span-5 h-28 w-full" />
          <div className="col-span-2" />
          <Skeleton className="col-span-5 h-28 w-full" />
        </div>
        <Skeleton className="h-[520px] w-full" />
      </div>
    </div>
  );
}
