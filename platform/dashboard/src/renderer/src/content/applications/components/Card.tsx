import { useMemo } from "react"
import { Label, LabelGroup } from "@patternfly/react-core"

import CardInGallery from "@jaas/components/CardInGallery"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import api from "./api"
import type Props from "./Props"
import ApplicationIcon from "./Icon"

function description(props: Props) {
  /* const [editing, setEditing] = useState(false)
  const editOn = useCallback(() => setEditing(true), [setEditing])
  const editOff = useCallback(() => setEditing(false), [setEditing])

  return <TextArea autoResize rows={30} onFocus={editOn} onBlur={editOff} readOnlyVariant={editing ? undefined : "plain"} onClick={stopPropagation} value={props.application.spec.description} />*/
  return props.application.spec.description
}

export default function ApplicationCard(props: Props) {
  const { name, context } = props.application.metadata

  const groups = useMemo(
    () => [...api(props), props.application.spec.description && descriptionGroup("Description", description(props))],
    [props],
  )

  const { tags } = props.application.spec
  const actions =
    !tags || tags.length === 0
      ? undefined
      : useMemo(
          () => ({
            hasNoOffset: true,
            actions: (
              <LabelGroup isCompact numLabels={2}>
                {tags.map((tag) => (
                  <Label isCompact color="cyan" key={tag}>
                    {tag}
                  </Label>
                ))}
              </LabelGroup>
            ),
          }),
          [tags.join(";")],
        )
  return (
    <CardInGallery
      kind="applications"
      name={name}
      icon={<ApplicationIcon {...props.application} />}
      groups={groups}
      actions={actions}
      context={context}
    />
  )
}
