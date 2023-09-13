import { ReactNode } from "react"
import { Link } from "react-router-dom"

import {
  ActionGroup,
  Button,
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
  ToolbarItem,
} from "@patternfly/react-core"

import Base, { BaseState } from "./Base"

import BackIcon from "@patternfly/react-icons/dist/esm/icons/arrow-left-icon"

type Values = FormContextProps["values"]
type SetValue = FormContextProps["setValue"]

type State = BaseState & {
  isCreating: boolean
}

export default class NewWorkerPool extends Base<unknown, State> {
  private readonly handleNameChange = () => {}

  private name(setValue: SetValue, values: Values) {
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

  private doCreate(values: Values) {
    console.log(values) // make eslint happy
    this.setState({ isCreating: true })
  }

  private actions(values: Values) {
    return (
      <ActionGroup>
        <Button isLoading={this.state?.isCreating} onClick={() => this.doCreate(values)}>
          Create
        </Button>

        {this.returnToDashboardButton("secondary", "Cancel")}
      </ActionGroup>
    )
  }

  private returnToDashboardButton(
    variant: "link" | "secondary" = "link",
    text: ReactNode = (
      <>
        <BackIcon /> Return to Dashboard
      </>
    ),
  ) {
    const queryParams = new URLSearchParams(window.location.search)
    const returnTo = queryParams.get("returnto") || "/"
    return (
      <Button
        isInline
        variant={variant}
        component={(props) => (
          <Link {...props} to={returnTo}>
            {text}
          </Link>
        )}
      />
    )
  }

  protected override footerRight() {
    return <ToolbarItem>{this.returnToDashboardButton()}</ToolbarItem>
  }

  protected override body() {
    return (
      <FormContextProvider initialValues={{ poolName: "mypool" }}>
        {({ setValue, values }) => (
          <Form>
            <FormSection title="Create Worker Pool">
              <Grid hasGutter md={6}>
                <GridItem span={12}>{this.name(setValue, values)}</GridItem>
              </Grid>
            </FormSection>

            {this.actions(values)}
          </Form>
        )}
      </FormContextProvider>
    )
  }
}
