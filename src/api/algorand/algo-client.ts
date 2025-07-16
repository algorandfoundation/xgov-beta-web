import { AlgorandClient as AC } from "@algorandfoundation/algokit-utils";
import { ClientManager } from "@algorandfoundation/algokit-utils/types/client-manager";
import algosdk from "algosdk";
import { env } from "@/constants";
import {
  getNumericEnvironmentVariable,
  getStringEnvironmentVariable,
} from "@/functions";

const DEFAULT_ALGOD_SERVER = "https://fnet-api.4160.nodely.dev";
const DEFAULT_ALGOD_PORT = 443;
const DEFAULT_ALGOD_TOKEN = "";

const DEFAULT_INDEXER_SERVER = "https://fnet-idx.4160.nodely.dev";
const DEFAULT_INDEXER_PORT = 443;
const DEFAULT_INDEXER_TOKEN = "";

// console.log("Loading AlgorandClient");
export const indexer = ClientManager.getIndexerClient({
  server: env.PUBLIC_INDEXER_SERVER || DEFAULT_INDEXER_SERVER,
  port: env.PUBLIC_INDEXER_PORT || DEFAULT_INDEXER_PORT,
  token: env.PUBLIC_INDEXER_TOKEN || DEFAULT_INDEXER_TOKEN,
});

export const algod = ClientManager.getAlgodClient({
  server: env.PUBLIC_ALGOD_SERVER || DEFAULT_ALGOD_SERVER,
  port: env.PUBLIC_ALGOD_PORT || DEFAULT_ALGOD_PORT,
  token: env.PUBLIC_ALGOD_TOKEN || DEFAULT_ALGOD_TOKEN,
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

export function getAlgodClient(locals: App.Locals, prefix: "PUBLIC" | "BACKEND"): algosdk.Algodv2 {
  const server = getStringEnvironmentVariable(
    `${prefix}_ALGOD_SERVER`,
    locals,
    DEFAULT_ALGOD_SERVER,
  );
  const port = getNumericEnvironmentVariable(
    `${prefix}_ALGOD_PORT`,
    locals,
    DEFAULT_ALGOD_PORT,
  );
  const token = getStringEnvironmentVariable(
    `${prefix}_ALGOD_TOKEN`,
    locals,
    DEFAULT_ALGOD_TOKEN,
  );
  return ClientManager.getAlgodClient({
    server,
    port,
    token,
  });
}
export function getIndexerClient(locals: App.Locals, prefix: "PUBLIC" | "BACKEND"): algosdk.Indexer {
  const server = getStringEnvironmentVariable(
    `${prefix}_INDEXER_SERVER`,
    locals,
    DEFAULT_INDEXER_SERVER,
  );
  const port = getNumericEnvironmentVariable(
    `${prefix}_INDEXER_PORT`,
    locals,
    DEFAULT_INDEXER_PORT,
  );
  const token = getStringEnvironmentVariable(
    `${prefix}_INDEXER_TOKEN`,
    locals,
    DEFAULT_INDEXER_TOKEN,
  );
  return ClientManager.getIndexerClient({
    server,
    port,
    token,
  });
}

// default txn lifetime/validity is too small. 120 rounds = ~5mins+
algorand.setDefaultValidityWindow(120);

export const network = env.PUBLIC_NETWORK;
