import { doesKindClusterExist } from "./kind"

export async function doesClusterExist() {
  return doesKindClusterExist()
}
