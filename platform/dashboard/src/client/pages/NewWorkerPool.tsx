import { PureComponent } from "react"

import {
  Form,
  FormContextProvider,
  FormContextProps,
  FormGroup,
  FormHelperText,
  FormSection,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  TextInput,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

type Props = {
  applications: string[]
  datasets: string[]

  /** Handler to call when this dialog closes */
  onClose(): void
}

export default class NewWorkerPool extends PureComponent<Props> {
  private readonly handleNameChange = () => {}

  private name({ setValue, values }: FormContextProps) {
    const name = values.poolName

    return (
      <FormGroup label="Pool name" isRequired fieldId="poolName">
        <TextInput
          isRequired
          type="text"
          id="poolName"
          name="poolName"
          aria-describedby="poolName-helper"
          value={name}
          onChange={(evt, value) => setValue("poolName", value)}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Choose a name for your worker pool</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
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

  private step1(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-configure" name="Configure">
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{this.name(ctrl)}</GridItem>
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
