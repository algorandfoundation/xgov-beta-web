import { useQuery } from "@tanstack/react-query";
import { getAllProposers, getGlobalState, getIsProposer, getIsXGov } from "src/api/registry";

export function useRegistry() {
    return useQuery({
        queryKey: ['getGlobalState'],
        queryFn: getGlobalState,
    });
}

export function useXGov(address: string | null) {
    return useQuery({
        queryKey: ['getIsXGov', address],
        queryFn: () => getIsXGov(address!),
        enabled: !!address,
    });
}

export function useProposer(address: string | null) {
    return useQuery({
        queryKey: ['getIsProposer', address],
        queryFn: () => getIsProposer(address!),
        enabled: !!address,
    });
}

export function useAllProposers() {
    return useQuery({
        queryKey: ['getAllProposers'],
        queryFn: () => getAllProposers(),
    });
}