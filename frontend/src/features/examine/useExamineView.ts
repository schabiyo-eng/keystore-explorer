import { useSyncExternalStore } from "react";
import type { ExamineView } from "./view";
import { getExamineView, subscribeExamineView } from "./view";

export function useExamineView() {
  return useSyncExternalStore(subscribeExamineView, getExamineView, getExamineView);
}

export function useMatchedView<D extends ExamineView["dialog"]>(dialog: D) {
  const view = useExamineView();
  if (view?.dialog !== dialog) {
    return undefined;
  }
  return view as Extract<ExamineView, { dialog: D }>;
}
