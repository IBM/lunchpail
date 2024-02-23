export default function isError(response: null | unknown | { error: unknown }): response is { error: unknown } {
  return response !== null && typeof response === "object" && "error" in response
}
