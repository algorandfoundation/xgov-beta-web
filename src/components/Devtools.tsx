import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { UseQuery } from "@/hooks/useQuery.tsx";

export function Devtools() {
  return (
    <UseQuery>
      <ReactQueryDevtools />
    </UseQuery>
  );
}
