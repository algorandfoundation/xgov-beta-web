import { getUrl, type NFD } from "@/api";
import { env } from "@/constants";
import { useQueries } from "@tanstack/react-query";

const isLocalnet = env.PUBLIC_NETWORK === "localnet"

export function useUrls(nfdProperties: { [address: string]: NFD } | undefined, enabled: boolean = true){
    if (!nfdProperties || Object.keys(nfdProperties).length === 0) {
      return useQueries({
        queries: [],
      })
    }

    return useQueries({
      queries: Object.values(nfdProperties).map((nfd) => ({
        queryKey: ["useUrl", nfd?.properties?.internal?.name],
        queryFn: () => getUrl(nfd?.properties),
        enabled: enabled && !!nfd && !isLocalnet && !!nfd?.properties?.internal?.name,
      })),
    })
}
