import { PureComponent } from "react"

import {
  Form,
  FormContextProvider,
  FormContextProps,
  FormSection,
  Grid,
  GridItem,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import { Input, Select } from "./Forms"

type Props = {
  applications: string[]
  datasets: string[]

  /** Handler to call when this dialog closes */
  onClose(): void
}

type State = {
  /** Is the current step valid, i.e. can we enable the Next button? */
  //  isCurrentStepIsValid: boolean
}

export default class NewWorkerPool extends PureComponent<Props, State> {
  private readonly handleNameChange = () => {}

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
        options={this.props.applications}
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
        options={this.props.datasets}
      />
    )
  }

  private readonly doCreate = (values: FormContextProps["values"]) => {
    console.log(values) // make eslint happy
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

  private review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="new-worker-pool-step-review"
        name="Review"
        footer={{ nextButtonText: "Create Worker Pool", onNext: () => this.doCreate(ctrl.values) }}
      >
        TODO
      </WizardStep>
    )
  }

  public render() {
    return (
      <FormContextProvider initialValues={{ poolName: "mypool" }}>
        {(ctrl) => (
          <Wizard header={this.header()} onClose={this.props.onClose}>
            {this.step1(ctrl)}
            {this.step2(ctrl)}
            {this.review(ctrl)}
          </Wizard>
        )}
      </FormContextProvider>
    )
  }
}
