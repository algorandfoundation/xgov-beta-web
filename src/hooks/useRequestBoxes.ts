import { getAllXGovSubscribeRequests } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useAllRequestBoxes() {
  return useQuery({
    queryKey: ["getAllXGovSubscribeRequests"],
    queryFn: () => getAllXGovSubscribeRequests(),
  });
}