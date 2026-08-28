import { useSyncExternalStore } from "react";
import { getDetailsView, subscribeDetailsView, type DetailsView } from "./view";

export function useDetailsView(): DetailsView | null {
  return useSyncExternalStore(subscribeDetailsView, getDetailsView, getDetailsView);
}
