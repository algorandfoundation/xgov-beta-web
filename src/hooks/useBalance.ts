import { fetchBalance } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useBalance(address: string | null) {
  return useQuery({
    queryKey: ['account-balance', address],
    queryFn: () => fetchBalance(address),
    enabled: !!address,
    refetchInterval: 1000 * 30,
  })
}