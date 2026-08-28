import { useSyncExternalStore } from "react";
import { getState, subscribe } from "./session";
import type { SessionState } from "./types";

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getState, getState);
}
