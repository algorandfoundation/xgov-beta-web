import type { ReactNode } from "react";
import { queryClient } from "@/stores/query.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { XGovSDKProvider } from "@/hooks/sdk/XGovSDKProvider";

export function UseQuery({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <XGovSDKProvider>
        {children}
      </XGovSDKProvider>
    </QueryClientProvider>
  );
}
