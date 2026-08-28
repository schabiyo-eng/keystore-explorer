import type { CommandParams } from "../../shell/types";

export function str(params: CommandParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

export function flag(params: CommandParams | undefined, key: string): boolean | undefined {
  const value = params?.[key];
  return typeof value === "boolean" ? value : undefined;
}

export function num(params: CommandParams | undefined, key: string): number | undefined {
  const value = params?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function cancelled(params?: CommandParams): boolean {
  return flag(params, "cancel") === true;
}
