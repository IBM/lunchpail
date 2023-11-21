/** Try to parse as JSON */
export default function tryParse(value: string) {
  try {
    return JSON.parse(value)
  } catch (err) {
    console.error(`Error parsing as JSON: '${value}'`)
    return undefined
  }
}
