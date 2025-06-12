import { AlgorandClient as AC } from "@algorandfoundation/algokit-utils";
import { ClientManager } from "@algorandfoundation/algokit-utils/types/client-manager";
import algosdk from "algosdk";
import { env } from "@/constants";

console.log("Loading AlgorandClient");
export const indexer = ClientManager.getIndexerClient({
  server: env.PUBLIC_INDEXER_SERVER || "https://fnet-idx.4160.nodely.dev",
  port: env.PUBLIC_INDEXER_PORT || "443",
  token: env.PUBLIC_INDEXER_TOKEN || "",
});

export const algod = ClientManager.getAlgodClient({
  server: env.PUBLIC_ALGOD_SERVER || "https://fnet-api.4160.nodely.dev",
  port: env.PUBLIC_ALGOD_PORT || "443",
  token: env.PUBLIC_ALGOD_TOKEN || "",
});

export const kmd: algosdk.Kmd | undefined =
  env.PUBLIC_NETWORK === "localnet"
    ? ClientManager.getKmdClient({
        server: env.PUBLIC_KMD_SERVER || "http://localhost",
        port: env.PUBLIC_KMD_PORT || "4002",
        token:
          env.PUBLIC_ALGOD_TOKEN ||
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      })
    : undefined;

export const algorand = AC.fromClients({ algod, indexer, kmd });

export const network = env.PUBLIC_NETWORK;
