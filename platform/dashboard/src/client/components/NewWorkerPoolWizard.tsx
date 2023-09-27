import { PureComponent } from "react"
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
  Text,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import { DataSetIcon } from "./DataSet"
import { applicationIcon } from "./Application"
import { Input, NumberInput, Select } from "./Forms"

import type { LocationProps } from "../router/withLocation"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import type NewPoolHandler from "../events/NewPoolHandler"

type Props = Pick<LocationProps, "searchParams"> & {
  /** Md5 of current application names */
  appMd5: string

  /** Currently available Applications */
  applications: ApplicationSpecEvent[]

  /** Currently available DataSets */
  datasets: string[]

  /** Handler to call when this dialog closes */
  onClose(): void

  /** Handler for NewWorkerPool */
  newpool: NewPoolHandler
}

type State = {
  /** Error in the request to create a pool? */
  errorInCreateRequest?: unknown
}

export default class NewWorkerPoolWizard extends PureComponent<Props, State> {
  private chooseAppIfExists(available: Props["applications"], desired: null | string) {
    if (desired && available.find((_) => _.application === desired)) {
      return desired
    } else {
      return ""
    }
  }

  private chooseDataSetIfExists(available: Props["datasets"], desired: null | string) {
    if (desired && available.includes(desired)) {
      return desired
    } else {
      return ""
    }
  }

  private defaults = {
    poolName: uniqueNamesGenerator({ dictionaries: [starWars], length: 1, style: "lowerCase" }).replace(/\s/g, "-"),
    count: String(1),
    size: "xs",
    supportsGpu: false.toString(),
    application:
      this.props.applications.length === 1
        ? this.props.applications[0].application
        : this.chooseAppIfExists(this.props.applications, this.props.searchParams.get("application")),
    dataset:
      this.props.datasets.length === 1
        ? this.props.datasets[0]
        : this.chooseDataSetIfExists(this.props.datasets, this.props.searchParams.get("dataset")),
  }

  public componentDidMount() {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }

  private name(ctrl: FormContextProps) {
    return <Input fieldId="poolName" label="Pool name" description="Choose a name for your worker pool" ctrl={ctrl} />
  }

  private application(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="application"
        label="Application"
        description="Choose the Application code this pool should run"
        ctrl={ctrl}
        options={this.props.applications.map((_) => _.application)}
        icons={this.props.applications.map(applicationIcon)}
      />
    )
  }

  private dataset(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="dataset"
        label="Data Set"
        description="Choose the Data Set this pool should process"
        ctrl={ctrl}
        options={this.props.datasets.sort()}
        icons={<DataSetIcon />}
      />
    )
  }

  private numWorkers(ctrl: FormContextProps) {
    return (
      <NumberInput
        fieldId="count"
        label="Num Workers"
        description="Number of workers in this pool"
        ctrl={ctrl}
        defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
        min={1}
      />
    )
  }

  private readonly doCreate = async (values: FormContextProps["values"]) => {
    console.log("new worker pool request", values) // make eslint happy
    try {
      await this.props.newpool.newPool(values, this.workerPoolYaml(values))
    } catch (errorInCreateRequest) {
      if (errorInCreateRequest) {
        this.setState({ errorInCreateRequest })
        // TODO visualize this!!
      }
    }
    this.props.onClose()
  }

  private header() {
    return (
      <WizardHeader
        title="Create Worker Pool"
        description="Configure a pool of compute resources to process a given data set."
        onClose={this.props.onClose}
      />
    )
  }

  private isStep1Valid(ctrl: FormContextProps) {
    return ctrl.values.poolName && ctrl.values.application && ctrl.values.dataset
  }

  private step1(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="new-worker-pool-step-configure"
        name="Configure"
        footer={{ isNextDisabled: !this.isStep1Valid(ctrl) }}
      >
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{this.name(ctrl)}</GridItem>
              <GridItem>{this.application(ctrl)}</GridItem>
              <GridItem>{this.dataset(ctrl)}</GridItem>
              <GridItem>{this.numWorkers(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private step2(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-locate" name="Choose a Location">
        TODO
      </WizardStep>
    )
  }

  private workerPoolYaml(values: FormContextProps["values"]) {
    const namespace = "todo"

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

  private review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="new-worker-pool-step-review"
        name="Review"
        footer={{ nextButtonText: "Create Worker Pool", onNext: () => this.doCreate(ctrl.values) }}
      >
        <Text component="p">Validate the settings for your new worker pool.</Text>

        <SyntaxHighlighter language="yaml" style={syntaxHighlightTheme} showLineNumbers>
          {this.workerPoolYaml(ctrl.values)}
        </SyntaxHighlighter>
      </WizardStep>
    )
  }

  public render() {
    return (
      <FormContextProvider initialValues={this.defaults}>
        {(ctrl) => (
          <Wizard header={this.header()} onClose={this.props.onClose}>
            {this.step1(ctrl)}
            {/*this.step2(ctrl)*/}
            {this.review(ctrl)}
          </Wizard>
        )}
      </FormContextProvider>
    )
  }
}
