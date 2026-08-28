import type { CommandParams } from "../../shell/types";

export function flag(params: CommandParams | undefined, key: string): boolean | undefined {
  const value = params?.[key];
  return typeof value === "boolean" ? value : undefined;
}
