import { flag, resolvePassword, str } from "../file/params";
import type { CommandParams } from "../../shell/types";

export { flag, resolvePassword, str };

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
