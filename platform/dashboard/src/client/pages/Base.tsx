import { Fragment, PureComponent } from "react"

import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Stack,
  StackItem,
  Switch,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core"

export interface BaseState {
  /** UI in dark mode? */
  useDarkMode: boolean
}

export default class Base<Props = unknown, State extends BaseState = BaseState> extends PureComponent<Props, State> {
  private readonly toggleDarkMode = () =>
    this.setState((curState) => {
      const useDarkMode = !curState?.useDarkMode
      if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
      else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")

      return { useDarkMode }
    })

  private header() {
    return (
      <Masthead>
        <MastheadMain>
          <MastheadBrand>Queueless Dashboard</MastheadBrand>
        </MastheadMain>

        <MastheadContent>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem align={{ default: "alignRight" }}>
                <Switch label="Dark Mode" isChecked={this.state?.useDarkMode} onChange={this.toggleDarkMode} />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    )
  }

  protected body() {
    return <Fragment />
  }

  protected footer() {
    return <Fragment />
  }

  public render() {
    return (
      <Stack className="codeflare--dashboard" data-is-dark-mode={this.state?.useDarkMode || false}>
        <StackItem>{this.header()}</StackItem>
        <StackItem isFilled>{this.body()}</StackItem>
        <StackItem>{this.footer()}</StackItem>
      </Stack>
    )
  }
}
