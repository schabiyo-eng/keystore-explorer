import type { CommandParams } from "../../shell/types";

export { flag, str } from "../file/params";

export function scalar(params: CommandParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
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
