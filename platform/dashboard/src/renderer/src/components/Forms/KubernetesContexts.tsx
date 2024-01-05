import { useEffect, useState } from "react"
import { Flex, FlexItem, Spinner } from "@patternfly/react-core"

import Values from "./Values"
import Select, { type SelectOptionProps } from "./Select"

import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon"
import NamespaceIcon from "@patternfly/react-icons/dist/esm/icons/at-icon"

type KubeValues = Values<{ kubecontext: string }>

export default function KubernetesContexts<Ctrl extends KubeValues>(props: { ctrl: Ctrl; description?: string }) {
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
              .then(({ config, current }) => {
                if (config.contexts.length === 0 || !current) {
                  setContexts("No contexts found")
                } else {
                  const options = config.contexts.map(({ name: context }) => {
                    const isKind = /^kind-/.test(context)
                    const openshiftMatch = context.match(/^(.+)\/(.+)\/([^/]+)$/)
                    const clusterType = isKind ? "Kind cluster" : openshiftMatch ? "Openshift cluster" : ""

                    const cluster = openshiftMatch ? openshiftMatch[2] : context.replace(/^kind-/, "")

                    const description = isKind ? (
                      clusterType
                    ) : openshiftMatch ? (
                      <Flex>
                        <FlexItem>{clusterType}</FlexItem>
                        <FlexItem>
                          <NamespaceIcon /> {openshiftMatch[1]}
                        </FlexItem>
                        <FlexItem>
                          <UserIcon /> {openshiftMatch[3].replace(/^IAM#/, "")}
                        </FlexItem>
                      </Flex>
                    ) : undefined

                    return {
                      children: cluster,
                      description,
                      value: context,
                      search: [clusterType, context].join(" "),
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
        description={props.description ?? "Choose a Kubernetes context"}
        options={contexts}
        currentSelection={current ?? ""}
      />
    )
  }
}
