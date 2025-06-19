import { useQuery } from "@tanstack/react-query";
import { getNonFungibleDomainName, getNonFungibleDomainNames } from "@/api";
import { env } from "@/constants";

const isLocalnet = env.PUBLIC_NETWORK === "localnet"

function toNFDsOptions(addresses: string[] | undefined, enabled: boolean = true) {
  return {
    queryKey: ["getNonFungibleDomainNames", addresses],
    queryFn: () => getNonFungibleDomainNames(addresses!),
    enabled: enabled && addresses !== undefined && !isLocalnet,
  };
}

export function useNFDs(addresses: string[] | undefined, enabled: boolean = true) {
  return useQuery(toNFDsOptions(addresses, enabled));
}

function toNFDOptions(address: string | null) {
  return {
    queryKey: ["getNonFungibleDomainName", address],
    queryFn: () => getNonFungibleDomainName(address!),
    enabled: !!address && !isLocalnet,
  };
}
export function useNFD(address: string | null) {
  return useQuery(toNFDOptions(address));
}
