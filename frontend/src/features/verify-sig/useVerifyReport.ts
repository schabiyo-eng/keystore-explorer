import { useSyncExternalStore } from "react";
import { getReport, subscribeVerifyReport, type VerifyReport } from "./report";

export function useVerifyReport(): VerifyReport | null {
  return useSyncExternalStore(subscribeVerifyReport, getReport, getReport);
}
