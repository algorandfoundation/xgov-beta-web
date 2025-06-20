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
  localsKey: string,
  locals: App.Locals,
  defaultValue: number,
): number {
  // @ts-expect-error, runtime can be undefined
  return locals?.runtime?.env && localsKey in locals?.runtime?.env
    ? // @ts-expect-error, runtime can be undefined
      parseInt(locals.runtime.env[localsKey], 10)
    : defaultValue;
}

export function getStringEnvironmentVariable(key: string, locals: App.Locals, defaultValue: string): string {
  // @ts-expect-error, this can be undefined
  if (locals?.runtime?.env && key in locals?.runtime?.env)
    // @ts-expect-error, this can be undefined
    return locals?.runtime?.env[key];
  return import.meta.env[key] ?? defaultValue;
}
