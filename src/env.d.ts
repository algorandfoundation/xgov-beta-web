/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime?: {
      env?: {
        COMMITTEE_BUCKET?: unknown;
        COMMITTEE_FILES_BUCKET?: unknown;
        COMMITTEE_R2_PREFIX?: string;
        [key: string]: unknown;
      };
    };
  }
}
