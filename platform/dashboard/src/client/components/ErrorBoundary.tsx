import { useRouteError } from "react-router-dom"
import { Bullseye, Stack, StackItem, Text, TextContent } from "@patternfly/react-core"

export default function ErrorBoundary() {
  const error = useRouteError()
  return (
    <Bullseye>
      <Stack hasGutter>
        <StackItem isFilled />
        <StackItem>
          <Bullseye>
            <img src="/assets/404.png" />
          </Bullseye>
        </StackItem>
        <StackItem>
          <Bullseye>
            <TextContent>
              <Text component="h1" style={{ textAlign: "center" }}>
                Internal Error
              </Text>
              <Text component="p">{String(error)}</Text>
            </TextContent>
          </Bullseye>
        </StackItem>
        <StackItem isFilled />
      </Stack>
    </Bullseye>
  )
}
