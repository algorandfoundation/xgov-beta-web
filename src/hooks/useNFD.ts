import { useQueries, useQuery } from "@tanstack/react-query";
import { getNonFungibleDomainName } from "@/api";


export function useNFDs(addresses: string[]) {
  return useQueries({
    queries: addresses.map(toNFDOptions),
  })
}

function toNFDOptions(address: string | null) {
  return {
    queryKey: ["getNonFungibleDomainName", address],
    queryFn: () => getNonFungibleDomainName(address!),
    enabled: !!address,
  };
}
export function useNFD(address: string | null) {
  return useQuery(toNFDOptions(address));
}
