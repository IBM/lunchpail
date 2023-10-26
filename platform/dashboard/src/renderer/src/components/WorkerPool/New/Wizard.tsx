import removeAccents from "remove-accents"
import { useSearchParams } from "react-router-dom"
import { useCallback, useEffect, useState } from "react"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { nord as syntaxHighlightTheme } from "react-syntax-highlighter/dist/esm/styles/prism"

import {
  Form,
  FormContextProvider,
  FormContextProps,
  FormSection,
  Grid,
  GridItem,
  TextContent,
  Text,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import DataSetIcon from "../../DataSet/Icon"
import ApplicationIcon from "../../Application/Icon"

import { singular as names } from "../../../names"
import { Input, NumberInput, Select } from "../../Forms"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = {
  /** Currently available Applications */
  applications: ApplicationSpecEvent[]

  /** Currently available DataSets */
  datasets: string[]

  /** Handler to call when this dialog closes */
  onSuccess(): void

  /** Handler to call when this dialog closes */
  onCancel(): void
}

export default function NewWorkerPoolWizard(props: Props) {
  /** Error in the request to create a pool? */
  const [, setErrorInCreateRequest] = useState<null | unknown>(null)
  const [searchParams] = useSearchParams()

  /* private chooseAppIfExists(available: Props["applications"], desired: null | string) {
    if (desired && available.find((_) => _.application === desired)) {
      return desired
    } else {
      return ""
    }
  } */

  function chooseDataSetIfExists(available: Props["datasets"], desired: null | string) {
    if (desired && available.includes(desired)) {
      return desired
    } else {
      return ""
    }
  }

  /* function get searchedApplication() {
    const app = searchParams.get("application")
    if (!app || !props.applications.find((_) => _.application === app)) {
      return null
    } else {
      return app
    }
  } */

  function searchedDataSet() {
    const dataset = searchParams.get("dataset")
    if (!dataset || !props.datasets.includes(dataset)) {
      return null
    } else {
      return dataset
    }
  }

  function supportsDataSet(app: ApplicationSpecEvent, dataset: string) {
    const datasets = app.spec.inputs ? app.spec.inputs[0].sizes : undefined
    return (
      datasets &&
      (datasets.xs === dataset ||
        datasets.sm === dataset ||
        datasets.md === dataset ||
        datasets.lg === dataset ||
        datasets.xl === dataset)
    )
  }

  function compatibleApplications() {
    const dataset = searchedDataSet()
    if (dataset) {
      return props.applications.filter((app) => supportsDataSet(app, dataset))
    } else {
      return props.applications
    }
  }

  function chooseIfSingleton(A: ApplicationSpecEvent[]): string {
    return A.length === 1 ? A[0].metadata.name : ""
  }

  /** Initial value for form */
  function defaults() {
    return {
      poolName: removeAccents(
        uniqueNamesGenerator({ dictionaries: [starWars], length: 1, style: "lowerCase" }).replace(/\s/g, "-"),
      ),
      count: String(1),
      size: "xs",
      supportsGpu: false.toString(),
      application: chooseIfSingleton(compatibleApplications()),
      dataset:
        props.datasets.length === 1 ? props.datasets[0] : chooseDataSetIfExists(props.datasets, searchedDataSet()),
    }
  }

  useEffect(() => {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }, [])

  function name(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="poolName"
        label="Pool name"
        description={`Choose a name for your ${names.workerpools}`}
        ctrl={ctrl}
      />
    )
  }

  function application(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="application"
        label={names.applications}
        description={`Choose the ${names.applications} code this pool should run`}
        ctrl={ctrl}
        options={compatibleApplications().map((_) => ({
          value: _.metadata.name,
          description: <div className="codeflare--max-width-30em">{_.spec.description}</div>,
        }))}
        icons={compatibleApplications().map(ApplicationIcon)}
      />
    )
  }

  function dataset(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="dataset"
        label={names.datasets}
        description={`Choose the ${names.datasets} this pool should process`}
        ctrl={ctrl}
        options={props.datasets.sort()}
        icons={<DataSetIcon />}
      />
    )
  }

  function numWorkers(ctrl: FormContextProps) {
    return (
      <NumberInput
        fieldId="count"
        label="Worker count"
        description="Number of Workers in this pool"
        ctrl={ctrl}
        defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
        min={1}
      />
    )
  }

  const doCreate = useCallback(
    async (values: FormContextProps["values"]) => {
      console.log("new worker pool request", values) // make eslint happy
      try {
        await window.jay.create(values, workerPoolYaml(values))
      } catch (errorInCreateRequest) {
        if (errorInCreateRequest) {
          setErrorInCreateRequest(errorInCreateRequest)
          // TODO visualize this!!
        }
      }
      props.onSuccess()
    },
    [props.onSuccess],
  )

  function header() {
    return (
      <WizardHeader
        title="Create Worker Pool"
        description="Configure a pool of compute resources to process Tasks in a Queue."
        onClose={props.onCancel}
      />
    )
  }

  function isStep1Valid(ctrl: FormContextProps) {
    return ctrl.values.poolName && ctrl.values.application && ctrl.values.dataset
  }

  function step1(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-configure" name="Configure" footer={{ isNextDisabled: !isStep1Valid(ctrl) }}>
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{name(ctrl)}</GridItem>
              <GridItem>{application(ctrl)}</GridItem>
              <GridItem>{dataset(ctrl)}</GridItem>
              <GridItem>{numWorkers(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /*function step2(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-locate" name="Choose a Location">
        TODO
      </WizardStep>
    )
  }*/

  function workerPoolYaml(values: FormContextProps["values"]) {
    const applicationSpec = props.applications.find((_) => _.metadata.name === values.application)
    if (!applicationSpec) {
      console.error("Internal error: Application spec not found", values.application)
      // TODO how do we report this to the UI?
    }

    // TODO re: internal-error
    const namespace = applicationSpec ? applicationSpec.metadata.namespace : "internal-error"

    return `
apiVersion: codeflare.dev/v1alpha1
kind: WorkerPool
metadata:
  name: ${values.poolName}
  namespace: ${namespace}
spec:
  dataset: ${values.dataset}
  application:
    name: ${values.application}
  workers:
    count: ${values.count}
    size: ${values.size}
    supportsGpu: ${values.supportsGpu}
`
  }

  function review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="new-worker-pool-step-review"
        name="Review"
        footer={{ nextButtonText: "Create Worker Pool", onNext: () => doCreate(ctrl.values) }}
      >
        <TextContent>
          <Text component="p">Confirm the settings for your new worker pool.</Text>
        </TextContent>

        <SyntaxHighlighter language="yaml" style={syntaxHighlightTheme} showLineNumbers>
          {workerPoolYaml(ctrl.values)}
        </SyntaxHighlighter>
      </WizardStep>
    )
  }

  return (
    <FormContextProvider initialValues={defaults()}>
      {(ctrl) => (
        <Wizard header={header()} onClose={props.onCancel}>
          {step1(ctrl)}
          {/*step2(ctrl)*/}
          {review(ctrl)}
        </Wizard>
      )}
    </FormContextProvider>
  )
}
