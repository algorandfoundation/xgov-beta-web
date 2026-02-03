import { useQuery } from "@tanstack/react-query";
import {
  getAllProposers,
  getGlobalState,
  getIsProposer,
  getIsXGov,
  getAllSubscribedXGovs,
  getDelegatedXGovData,
} from "src/api/registry";
import type { RegistryGlobalState } from "@/api";

export function useRegistry(state?: RegistryGlobalState) {
  return useQuery({
    queryKey: ["getGlobalState"],
    queryFn: () => getGlobalState(),
    initialData: state,
    staleTime: 100,
  });
}

export function useXGov(address: string | null) {
  return useQuery({
    queryKey: ["getIsXGov", address],
    queryFn: () => getIsXGov(address!),
    enabled: !!address,
  });
}

export function useXGovDelegates(address: string | null) {
  return useQuery({
    queryKey: ["getDelegatedXGovs", address],
    queryFn: () => getDelegatedXGovData(address!),
    enabled: !!address,
  });
}

export function useProposer(address: string | null) {
  return useQuery({
    queryKey: ["getIsProposer", address],
    queryFn: () => getIsProposer(address!),
    enabled: !!address,
  });
}

export function useAllProposers() {
  return useQuery({
    queryKey: ["getAllProposers"],
    queryFn: () => getAllProposers(),
  });
}

export function useAllXGovs() {
  return useQuery({
    queryKey: ["getAllSubscribedXGovs"],
    queryFn: () => getAllSubscribedXGovs(),
  });
}
