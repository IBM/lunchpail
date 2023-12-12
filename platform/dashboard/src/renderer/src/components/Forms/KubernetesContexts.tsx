import { useEffect, useState } from "react"
import { Spinner } from "@patternfly/react-core"

import Values from "@jay/components/Forms/Values"
import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

type KubeValues = Values<{ kubecontext: string }>

function KubernetesContexts<Ctrl extends KubeValues>(props: { ctrl: Ctrl }) {
  const [contexts, setContexts] = useState<null | string | TileOptions>(null)
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
                  const tiles = contexts.map((context) => {
                    const openshiftMatch = context.match(/^(.+)\/(.+)\/([^/]+)$/)

                    const cluster = openshiftMatch ? openshiftMatch[2] : context.replace(/^kind-/, "")
                    const namespace = openshiftMatch ? openshiftMatch[1] : ""
                    const user = openshiftMatch ? openshiftMatch[3] : ""

                    const groups = [
                      descriptionGroup("cluster", cluster),
                      ...(!namespace ? [] : [descriptionGroup("namespace", namespace)]),
                      ...(!user ? [] : [descriptionGroup("user", user)]),
                      ...(!/^kind-/.test(context) ? [] : [descriptionGroup("info", "Local Kind cluster")]),
                      ...(!openshiftMatch ? [] : [descriptionGroup("info", "OpenShift cluster")]),
                    ]

                    const description = (
                      <DescriptionList props={{ isCompact: true, isFluid: true, isHorizontal: true }} groups={groups} />
                    )
                    return {
                      title: "",
                      description,
                      value: context,
                    }
                  }) as TileOptions // we know we have at least 1

                  setCurrent((prevCurrent) => prevCurrent ?? current) // don't override user choice
                  setContexts((prevTiles) =>
                    Array.isArray(prevTiles) &&
                    prevTiles.length === tiles.length &&
                    prevTiles.every((_, idx) => _.value === tiles[idx].value)
                      ? prevTiles
                      : tiles,
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
      <Tiles
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
