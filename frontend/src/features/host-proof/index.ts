import type { FeatureModule } from "../../shell/types";
import { commands as generateCommands } from "../generate";

/**
 * Glob last-wins can load this module after generate. Re-export the real
 * Tools → Generate Key Pair command so the host-proof stub cannot shadow it.
 * `proofCommands` stays a no-op with canExecute true for the File plugin-host test.
 */
export const commands: FeatureModule["commands"] = {
  generateKeyPair: generateCommands.generateKeyPair,
};

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
