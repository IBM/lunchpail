import { useEffect, useState } from "react"
import { Stack, StackItem, Spinner } from "@patternfly/react-core"

import Values from "./Values"
import Select, { type SelectOptionProps } from "./Select"

import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon"
import NamespaceIcon from "@patternfly/react-icons/dist/esm/icons/at-icon"

type KubeValues = Values<{ kubecontext: string }>

function KubernetesContexts<Ctrl extends KubeValues>(props: { ctrl: Ctrl }) {
  const [contexts, setContexts] = useState<null | string | SelectOptionProps[]>(null)
  const [current, setCurrent] = useState<string>(props.ctrl.values.kubecontext)

  useEffect(() => setCurrent(props.ctrl.values.kubecontext), [props.ctrl.values.kubecontext])

  useEffect(() => {
    if (window.jay.contexts) {
      // a bit of syntactic oddness here to invoke the interval right
      // away, and then every 2s
      const interval = setInterval(
        (function interval() {
          if (window.jay.contexts) {
            window.jay
              .contexts()
              .then(({ contexts, current }) => {
                if (contexts.length === 0 || !current) {
                  setContexts("No contexts found")
                } else {
                  const options = contexts.map((context) => {
                    const isKind = /^kind-/.test(context)
                    const openshiftMatch = context.match(/^(.+)\/(.+)\/([^/]+)$/)

                    const cluster = openshiftMatch ? openshiftMatch[2] : context.replace(/^kind-/, "")

                    const description = isKind ? (
                      "Local Kind cluster"
                    ) : openshiftMatch ? (
                      <Stack>
                        <StackItem>OpenShift cluster</StackItem>
                        <StackItem>
                          <NamespaceIcon /> {openshiftMatch[1]}
                        </StackItem>
                        <StackItem>
                          <UserIcon /> {openshiftMatch[3].replace(/^IAM#/, "")}
                        </StackItem>
                      </Stack>
                    ) : undefined

                    return {
                      children: cluster,
                      description,
                      value: context,
                    }
                  })

                  setCurrent((prevCurrent) => prevCurrent ?? current) // don't override user choice
                  setContexts((prevOptions) =>
                    Array.isArray(prevOptions) &&
                    prevOptions.length === options.length &&
                    prevOptions.every((_, idx) => _.value === options[idx].value)
                      ? prevOptions
                      : options,
                  )
                  // ^^^ take some care to avoid re-rendering if nothing has changed
                }
              })
              .catch((err) => {
                setContexts(String(err))
              })
          }

          return interval
        })(), // invoke right away
        2000, // and then every 2s
      )

      return () => clearInterval(interval)
    } else {
      return
    }
  }, [window.jay.contexts])

  if (!contexts) {
    return <Spinner />
  } else if (typeof contexts === "string") {
    return "Error fetching Kubernetes contexts: " + contexts
  } else {
    return (
      <Select
        borders
        ctrl={props.ctrl}
        fieldId="kubecontext"
        label="Kubernetes Context"
        options={contexts}
        currentSelection={current ?? ""}
      />
    )
  }
}

export default function contexts<Ctrl extends KubeValues>(ctrl: Ctrl) {
  return <KubernetesContexts<Ctrl> ctrl={ctrl} />
}
