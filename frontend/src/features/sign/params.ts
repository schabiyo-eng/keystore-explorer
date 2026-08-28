import type { CommandParams } from "../../shell/types";

export { flag, passwordOf, str } from "../file/params";

export function obj(
  params: CommandParams | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = params?.[key];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function num(params: CommandParams | undefined, key: string): number | undefined {
  const value = params?.[key];
  return typeof value === "number" ? value : undefined;
}

export function fileBasename(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

export function omitEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function commandParams(
  entries: Record<string, string | Record<string, unknown> | undefined>,
): CommandParams {
  const params: CommandParams = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== "") {
      params[key] = value;
    }
  }
  return params;
}
