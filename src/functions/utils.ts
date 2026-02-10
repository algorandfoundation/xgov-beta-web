import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function chunk<T>(arr: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) throw new Error("chunkSize must be greater than 0");

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

export function getNumericEnvironmentVariable(
  key: string,
  locals: App.Locals,
  defaultValue: number,
): number {
  return parseInt(
    getStringEnvironmentVariable(key, locals, defaultValue.toString()),
    10,
  );
}

export function getStringEnvironmentVariable(
  key: string,
  locals: App.Locals,
  defaultValue: string,
): string {
  if ("runtime" in locals && locals.runtime) {
    const { env } = (locals.runtime as any);
    if (key in env) {
      return env[key];
    }
  }
  return import.meta.env[key] ?? defaultValue;
}
