import { Fragment, PureComponent, ReactNode } from "react"

import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Page,
  PageSection,
  Switch,
  Toolbar,
  ToolbarGroup,
  ToolbarContent,
  ToolbarItem,
  MastheadToggle,
} from "@patternfly/react-core"

import { version } from "../../../package.json"
import SmallLabel from "../components/SmallLabel"
import { SidebarContent, SidebarToggle } from "./SidebarContent"

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
        <MastheadToggle>{SidebarToggle}</MastheadToggle>
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

  protected body(): ReactNode {
    return <Fragment />
  }

  protected footerLeft(): ReactNode {
    return <Fragment />
  }

  protected footerRight(): ReactNode {
    return <Fragment />
  }

  private footer(): ReactNode {
    return (
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup align={{ default: "alignLeft" }}>
            <ToolbarItem>
              <SmallLabel>v{version}</SmallLabel>
            </ToolbarItem>
            {this.footerLeft()}
          </ToolbarGroup>

          <ToolbarGroup align={{ default: "alignRight" }}>{this.footerRight()}</ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    )
  }

  public render() {
    return (
      <Page
        header={this.header()}
        sidebar={<SidebarContent />}
        className="codeflare--dashboard"
        data-is-dark-mode={this.state?.useDarkMode || false}
      >
        <PageSection hasOverflowScroll isFilled>
          {this.body()}
        </PageSection>
        <PageSection type="subnav">{this.footer()}</PageSection>
      </Page>
    )
  }
}
