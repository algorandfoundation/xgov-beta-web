/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type KVNamespace = import("@cloudflare/workers-types").KVNamespace;

declare namespace App {
  interface Locals {
    runtime?: {
      env: {
        KV?: KVNamespace;
        [key: string]: unknown;
      };
    };
  }
}
