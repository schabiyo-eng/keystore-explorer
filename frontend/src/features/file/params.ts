import { TEST_PASSWORD } from "../../kernel";
import type { CommandParams } from "../../shell/types";

export function str(params: CommandParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

export function flag(params: CommandParams | undefined, key: string): boolean | undefined {
  const value = params?.[key];
  return typeof value === "boolean" ? value : undefined;
}

export function resolvePassword(raw: unknown): string | undefined {
  if (raw === "TEST_PASSWORD") {
    return TEST_PASSWORD;
  }
  if (typeof raw === "string") {
    return raw;
  }
  return undefined;
}

export function passwordOf(params?: CommandParams): string | undefined {
  return resolvePassword(params?.password);
}
