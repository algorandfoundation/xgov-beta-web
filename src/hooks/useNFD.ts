import { useQuery } from "@tanstack/react-query";
import { getNonFungibleDomainName } from "src/api/nfd";

export function useNFD(address: string | null) {
    return useQuery({
        queryKey: ['getNonFungibleDomainName', address],
        queryFn: () => getNonFungibleDomainName(address!),
        enabled: !!address,
    });
}