import type { FeatureModule } from "../../shell/types";

/** Glob-loaded no-op. The proof test registers `proofCommands` at runtime. */
export const commands: FeatureModule["commands"] = {};

/**
 * Stub feature used to prove the plugin host: registering this enables
 * Tools → Generate Key Pair with no MenuBar / Toolbar / loadFeatures edit.
 */
export const proofCommands: FeatureModule["commands"] = {
  generateKeyPair: {
    canExecute: () => true,
    run: async () => {},
  },
};
