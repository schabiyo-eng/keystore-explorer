import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import {
  ABOUT_LICENSE,
  ABOUT_TICKER,
  APP_NAME,
  APP_VERSION,
  JAR_COLUMNS,
  JAR_ROWS,
  SECURITY_PROVIDERS,
  systemFields,
} from "./info";
import { getUpdateResult } from "./update";
import "./chrome.css";

function OkButton({ dialogId, command }: { dialogId: string; command: string }) {
  return (
    <button
      type="button"
      data-testid={`${dialogId}.ok`}
      aria-label="OK"
      onClick={() => void runCommand(command, { dismiss: true })}
    >
      OK
    </button>
  );
}

export function AboutDialog() {
  return (
    <FrameDialog
      id="dialog.about"
      title={`About ${APP_NAME}`}
      open
      actions={
        <>
          <button type="button">Credits</button>
          <OkButton dialogId="dialog.about" command="about" />
        </>
      }
    >
      <div className="chrome-about">
        <div>
          <p className="chrome-about-name">{APP_NAME}</p>
          <p>Version {APP_VERSION}</p>
          <p className="chrome-about-license">{ABOUT_LICENSE}</p>
        </div>
        <div className="chrome-about-mark" aria-hidden="true">
          KSE
        </div>
        <p className="chrome-about-ticker">{ABOUT_TICKER.join("   •   ")}</p>
      </div>
    </FrameDialog>
  );
}

export function JarsDialog() {
  return (
    <FrameDialog
      id="dialog.jars"
      title="JAR Information"
      open
      actions={<OkButton dialogId="dialog.jars" command="jars" />}
    >
      <div className="chrome-table-wrap">
        <table className="entry-table">
          <thead>
            <tr>
              {JAR_COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JAR_ROWS.map((row) => (
              <tr key={row.file}>
                <td>{row.file}</td>
                <td>{row.size}</td>
                <td>{row.specTitle}</td>
                <td>{row.specVersion}</td>
                <td>{row.specVendor}</td>
                <td>{row.implTitle}</td>
                <td>{row.implVersion}</td>
                <td>{row.implVendor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FrameDialog>
  );
}

export function SecurityProvidersDialog() {
  return (
    <FrameDialog
      id="dialog.security-providers"
      title="Security Provider Information"
      open
      actions={
        <OkButton dialogId="dialog.security-providers" command="securityProviders" />
      }
    >
      <div className="chrome-tree">
        <ul>
          <li>
            Security Providers
            <ul>
              {SECURITY_PROVIDERS.map((provider) => (
                <li key={provider.title}>
                  {provider.title}
                  <ul>
                    <li>{provider.info}</li>
                    <li>{provider.impl}</li>
                    <li>
                      Services
                      <ul>
                        {provider.services.map((service) => (
                          <li key={service.name}>
                            {service.name}
                            <ul>
                              {service.algorithms.map((algorithm) => (
                                <li key={algorithm}>{algorithm}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </FrameDialog>
  );
}

export function SystemInformationDialog() {
  return (
    <FrameDialog
      id="dialog.system-information"
      title="System Information"
      open
      actions={
        <OkButton dialogId="dialog.system-information" command="systemInformation" />
      }
    >
      <div className="chrome-sys">
        {systemFields().map((field) => (
          <label key={field.label} className="chrome-sys-row">
            <span>{field.label}</span>
            <input readOnly value={field.value} />
          </label>
        ))}
      </div>
    </FrameDialog>
  );
}

export function CheckUpdateDialog() {
  return (
    <FrameDialog
      id="dialog.check-update"
      title="Check for Update"
      open
      actions={<OkButton dialogId="dialog.check-update" command="checkUpdate" />}
    >
      <p>{getUpdateResult() || "Checking for updates…"}</p>
    </FrameDialog>
  );
}
