import { Link } from "react-router-dom"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import { singular as run } from "@jaas/resources/runs/name"
import { singular as application } from "@jaas/resources/applications/name"

import type Step from "../Step"
import { repoPlusSource } from "../../tabs/Code"

const step: Step = {
  id: application,
  variant: () => "success",
  content: (props, onClick) => ({
    body: (
      <span>
        {!props.application.spec.code && (
          <>
            Code will be pulled from{" "}
            <Link onClick={onClick} target="_blank" to={props.application.spec.repo}>
              {repoPlusSource(props)}
            </Link>
          </>
        )}
      </span>
    ),
    footer: (
      <>
        This {run} uses the {application} defined by{" "}
        {linkToAllDetails("applications", [props.application], undefined, onClick)}
      </>
    ),
  }),
}

export default step
