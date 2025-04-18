import type { ReactNode } from "react";
import { queryClient } from "@/stores/query.ts";
import { QueryClientProvider } from "@tanstack/react-query";
export function UseQuery({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
