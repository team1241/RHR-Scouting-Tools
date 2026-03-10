"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/queries/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/providers/convex-provider";

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster richColors position="top-right" />
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
