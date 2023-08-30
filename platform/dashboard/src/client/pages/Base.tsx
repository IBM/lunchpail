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
  PageToggleButton,
} from "@patternfly/react-core"

import { version } from "../../../package.json"
import SmallLabel from "../components/SmallLabel"
import { SidebarContent } from "./SidebarContent"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

export interface BaseState {
  /** UI in dark mode? */
  useDarkMode: boolean
  /** is sidebar open? */
  isSidebarOpen: boolean
}

export default class Base<Props = unknown, State extends BaseState = BaseState> extends PureComponent<Props, State> {
  private readonly toggleDarkMode = () =>
    this.setState((curState) => {
      const useDarkMode = !curState?.useDarkMode
      if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
      else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")

      return { useDarkMode }
    })

  private readonly onSidebarToggle = () => {
    this.setState((curState) => ({
      isSidebarOpen: !curState?.isSidebarOpen,
    }))
  }

  private header() {
    return (
      <Masthead display={{ default: "inline" }}>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            isSidebarOpen={this.state?.isSidebarOpen}
            onSidebarToggle={this.onSidebarToggle}
            id="vertical-nav-toggle"
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
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
        sidebar={<SidebarContent isSidebarOpen={this.state?.isSidebarOpen} />}
        className="codeflare--dashboard"
        data-is-dark-mode={this.state?.useDarkMode || false}
      >
        <PageSection hasOverflowScroll isFilled aria-label="codeflare-dashboard-body">
          {this.body()}
        </PageSection>
        <PageSection padding={{ default: "noPadding" }} isFilled={false}>
          {this.footer()}
        </PageSection>
      </Page>
    )
  }
}
