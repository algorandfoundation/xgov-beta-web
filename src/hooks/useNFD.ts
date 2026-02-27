import { useQuery } from "@tanstack/react-query";
import { getNFD, getNFDs } from "@/api";
import { env } from "@/constants";

const isLocalnet = env.PUBLIC_NETWORK === "localnet"

function toNFDsOptions(addresses: string[] | undefined, enabled: boolean = true) {
  return {
    queryKey: ["getNFDs", addresses],
    queryFn: () => getNFDs(addresses!),
    enabled: enabled && !!addresses?.length && !isLocalnet,
    retry: false,
  };
}

export function useNFDs(addresses: string[] | undefined, enabled: boolean = true) {
  return useQuery(toNFDsOptions(addresses, enabled));
}

function toNFDOptions(address: string | null) {
  return {
    queryKey: ["getNFD", address],
    queryFn: () => getNFD(address!),
    enabled: !!address && !isLocalnet,
  };
}
export function useNFD(address: string | null) {
  return useQuery(toNFDOptions(address));
}
