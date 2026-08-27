import { emptyFacts, factsOf } from "./store";
import type { ErrorId, KernelFailure, KernelSuccess, KeyStore } from "./types";

export function fail(errorId: ErrorId, store?: KeyStore): KernelFailure {
  return {
    ok: false,
    errorId,
    facts: store ? factsOf(store, errorId) : emptyFacts(errorId),
  };
}

export function ok(store: KeyStore): KernelSuccess {
  return { ok: true, store, facts: factsOf(store) };
}
