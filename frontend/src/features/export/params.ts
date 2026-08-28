import type { CommandParams } from "../../shell/types";
import { flag } from "../file/params";

export { flag, passwordOf, resolvePassword, str } from "../file/params";

export function cancelled(params?: CommandParams): boolean {
  return flag(params, "cancel") === true || flag(params, "confirm") === false;
}
