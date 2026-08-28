import { useSyncExternalStore } from "react";
import { getUpdateResult, subscribeUpdateResult } from "./update";

export function useUpdateResult(): string {
  return useSyncExternalStore(subscribeUpdateResult, getUpdateResult, getUpdateResult);
}
