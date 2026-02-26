/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type R2Bucket = import("@cloudflare/workers-types").R2Bucket;

declare namespace App {
  interface Locals {
    runtime?: {
      env: {
        BUCKET?: R2Bucket;
        [key: string]: unknown;
      };
    };
  }
}
