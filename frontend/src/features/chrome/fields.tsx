import type { ReactNode } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { SYSTEM_INFORMATION_DIALOG } from "./dialog-ids";
import {
  ABOUT_LICENSE,
  ABOUT_TICKER,
  APP_NAME,
  APP_VERSION,
  JAR_COLUMNS,
  JAR_ROWS,
  SECURITY_PROVIDERS,
} from "./info";
import type { SystemField } from "./system";

export function OkButton({ dialogId, command }: { dialogId: string; command: string }) {
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

export function HelpDialog({
  id,
  title,
  command,
  extraActions,
  children,
}: {
  id: string;
  title: string;
  command: string;
  extraActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <FrameDialog
      id={id}
      title={title}
      open
      actions={
        <>
          {extraActions}
          <OkButton dialogId={id} command={command} />
        </>
      }
    >
      {children}
    </FrameDialog>
  );
}

export function AboutPanel() {
  return (
    <div className="chrome-about">
      <div>
        <p className="chrome-about-name">{APP_NAME}</p>
        <p>Version {APP_VERSION}</p>
        <p className="chrome-about-license">{ABOUT_LICENSE}</p>
      </div>
      <div className="chrome-about-mark" aria-hidden="true">
        KSE
      </div>
      <p className="chrome-about-ticker" aria-label="Acknowledgements">
        {ABOUT_TICKER.join("   •   ")}
      </p>
    </div>
  );
}

export function JarInformationTable() {
  return (
    <div className="chrome-table-wrap">
      <table className="entry-table">
        <thead>
          <tr>
            {JAR_COLUMNS.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
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
  );
}

export function SecurityProviderTree() {
  return (
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
  );
}

export function SystemInformationFields({ fields }: { fields: SystemField[] }) {
  return (
    <div className="chrome-sys">
      {fields.map((field) => {
        const inputId = `${SYSTEM_INFORMATION_DIALOG}.${field.id}`;
        return (
          <label key={field.id} className="chrome-sys-row" htmlFor={inputId}>
            <span>{field.label}</span>
            <input id={inputId} readOnly value={field.value} autoComplete="off" />
          </label>
        );
      })}
    </div>
  );
}
