import { useSyncExternalStore } from "react";
import { getExamineView, subscribeExamineView } from "./view";

export function useExamineView() {
  return useSyncExternalStore(subscribeExamineView, getExamineView, getExamineView);
}
