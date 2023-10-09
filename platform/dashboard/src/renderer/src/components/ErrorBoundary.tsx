import { useRouteError } from "react-router-dom"
import { Bullseye, Stack, StackItem, Text, TextContent } from "@patternfly/react-core"

import errorImageUrl from "../images/404.png"

type ErrorResponse = {
  error: {
    message: string
  }
}

function isErrorResponse(err: unknown): err is ErrorResponse {
  const error = err as ErrorResponse
  return typeof error.error === "object" && typeof error.error.message === "string"
}

function message(error: unknown) {
  if (isErrorResponse(error)) {
    return error.error.message
  } else {
    return String(error)
  }
}

export default function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)

  return (
    <Bullseye>
      <Stack hasGutter>
        <StackItem isFilled />
        <StackItem>
          <Bullseye>
            <img src={errorImageUrl} />
          </Bullseye>
        </StackItem>
        <StackItem>
          <Bullseye>
            <TextContent>
              <Text component="h1" style={{ textAlign: "center" }}>
                Internal Error
              </Text>
              <Text component="p">{message(error)}</Text>
            </TextContent>
          </Bullseye>
        </StackItem>
        <StackItem isFilled />
      </Stack>
    </Bullseye>
  )
}
