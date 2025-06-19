import { getUrl, type NFD } from "@/api";
import { env } from "@/constants";
import { useQueries } from "@tanstack/react-query";

const isLocalnet = env.PUBLIC_NETWORK === "localnet"

export function useUrls(nfdProperties: NFD[] | undefined, enabled: boolean = true, limit?: number){
    if (!nfdProperties || nfdProperties.length === 0) {
      return useQueries({
        queries: [],
      })
    }

    return useQueries({
      queries: nfdProperties?.map((nfd) => ({
        queryKey: ["useUrl", nfd!.properties.internal!.name],
        queryFn: () => getUrl(nfd!.properties),
        enabled: enabled && !!nfd && !isLocalnet,
      })),
    })
}