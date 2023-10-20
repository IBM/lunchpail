/**
 * "BlueJays" -> "Blue Jays"
 */
export default function camelCaseSplit(str: string) {
  return str.replace(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ")
}
