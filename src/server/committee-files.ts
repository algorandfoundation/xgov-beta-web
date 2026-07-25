import { getStringEnvironmentVariable } from "@/functions";

export interface CommitteeMember {
  address: string;
  votes: number;
}

export interface CommitteeData {
  xGovs: CommitteeMember[];
  [key: string]: unknown;
}

interface R2ObjectBody {
  body: ReadableStream | null;
  httpEtag?: string;
  httpMetadata?: {
    contentType?: string;
  };
  size: number;
  uploaded: Date;
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: {
    cursor?: string;
    limit?: number;
    prefix?: string;
  }): Promise<{
    cursor?: string;
    objects: Array<{
      key: string;
      size: number;
      httpEtag?: string;
      uploaded: Date;
    }>;
    truncated: boolean;
  }>;
}

export interface CommitteeFileSummary {
  etag?: string;
  key: string;
  name: string;
  size: number;
  uploaded: string;
  url: string;
}

const COMMITTEE_FILE_NAME_PATTERN = /^[A-Za-z0-9_-]+\.json$/;
const DEFAULT_COMMITTEE_R2_PREFIX = "";

function isCommitteeMember(member: unknown): member is CommitteeMember {
  return (
    !!member &&
    typeof member === "object" &&
    "address" in member &&
    typeof member.address === "string" &&
    "votes" in member &&
    typeof member.votes === "number" &&
    Number.isFinite(member.votes)
  );
}

function hasMatchingEtag(ifNoneMatch: string | null, etag?: string): boolean {
  if (!ifNoneMatch || !etag) {
    return false;
  }

  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag);
}

function getRuntimeEnv(locals: App.Locals): Record<string, unknown> {
  if ("runtime" in locals && locals.runtime) {
    const env = (locals.runtime as { env?: Record<string, unknown> }).env;
    if (env && typeof env === "object") {
      return env;
    }
  }

  return {};
}

export function getCommitteeBucket(locals: App.Locals): R2Bucket | null {
  const env = getRuntimeEnv(locals);
  const bucket = env.COMMITTEE_BUCKET ?? env.COMMITTEE_FILES_BUCKET;

  if (
    bucket &&
    typeof bucket === "object" &&
    "get" in bucket &&
    "list" in bucket
  ) {
    return bucket as R2Bucket;
  }

  return null;
}

export function getCommitteeR2Prefix(locals: App.Locals): string {
  const prefix = getStringEnvironmentVariable(
    "COMMITTEE_R2_PREFIX",
    locals,
    DEFAULT_COMMITTEE_R2_PREFIX,
  ).trim();

  if (!prefix) {
    return "";
  }

  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

export function isValidCommitteeFileName(fileName: string): boolean {
  return COMMITTEE_FILE_NAME_PATTERN.test(fileName);
}

export function getCommitteeObjectKey(
  fileName: string,
  locals: App.Locals,
): string {
  return `${getCommitteeR2Prefix(locals)}${fileName}`;
}

export function validateCommitteeData(
  committeeData: unknown,
): committeeData is CommitteeData {
  return (
    !!committeeData &&
    typeof committeeData === "object" &&
    "xGovs" in committeeData &&
    Array.isArray((committeeData as CommitteeData).xGovs) &&
    (committeeData as CommitteeData).xGovs.every(isCommitteeMember)
  );
}

export async function getCommitteeDataFromR2(
  fileName: string,
  locals: App.Locals,
): Promise<CommitteeData | null> {
  if (!isValidCommitteeFileName(fileName)) {
    throw new Error("Invalid committee file name");
  }

  const bucket = getCommitteeBucket(locals);
  if (!bucket) {
    throw new Error("COMMITTEE_BUCKET R2 binding is not configured");
  }

  const object = await bucket.get(getCommitteeObjectKey(fileName, locals));
  if (!object) {
    return null;
  }

  const committeeData = JSON.parse(await object.text()) as unknown;
  if (!validateCommitteeData(committeeData)) {
    throw new Error(`Committee file ${fileName} has invalid format`);
  }

  return committeeData;
}

export async function getCommitteeFileResponse(
  fileName: string,
  locals: App.Locals,
  request: Request,
): Promise<Response> {
  if (!isValidCommitteeFileName(fileName)) {
    return new Response("Invalid committee file name", { status: 400 });
  }

  const bucket = getCommitteeBucket(locals);
  if (!bucket) {
    return new Response("COMMITTEE_BUCKET R2 binding is not configured", {
      status: 500,
    });
  }

  const object = await bucket.get(getCommitteeObjectKey(fileName, locals));
  if (!object) {
    return new Response("Committee file not found", { status: 404 });
  }

  const headers = new Headers({
    "cache-control": "public, max-age=60",
    "content-type": object.httpMetadata?.contentType ?? "application/json",
  });
  if (object.httpEtag) {
    headers.set("etag", object.httpEtag);
  }

  if (hasMatchingEtag(request.headers.get("if-none-match"), object.httpEtag)) {
    return new Response(null, { headers, status: 304 });
  }

  return new Response(object.body, { headers });
}

export async function listCommitteeFiles(
  locals: App.Locals,
): Promise<CommitteeFileSummary[]> {
  const bucket = getCommitteeBucket(locals);
  if (!bucket) {
    throw new Error("COMMITTEE_BUCKET R2 binding is not configured");
  }

  const prefix = getCommitteeR2Prefix(locals);
  const files: CommitteeFileSummary[] = [];
  let cursor: string | undefined;

  do {
    const result = await bucket.list({ cursor, limit: 1000, prefix });

    for (const object of result.objects) {
      const name = object.key.slice(prefix.length);
      if (!isValidCommitteeFileName(name)) {
        continue;
      }

      files.push({
        etag: object.httpEtag,
        key: object.key,
        name,
        size: object.size,
        uploaded: object.uploaded.toISOString(),
        url: `/api/committees/${name}`,
      });
    }

    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return files.sort((a, b) => a.name.localeCompare(b.name));
}
