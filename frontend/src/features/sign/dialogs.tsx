import type { ReactNode } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { getLastJwt } from "./clipboard";

function SignDialog({
  id,
  title,
  command,
  children,
}: {
  id: string;
  title: string;
  command: string;
  children?: ReactNode;
}) {
  return (
    <FrameDialog
      id={id}
      title={title}
      open
      actions={
        <>
          <button type="button" data-testid={`${id}.ok`} onClick={() => void runCommand(command)}>
            OK
          </button>
          <button
            type="button"
            data-testid={`${id}.cancel`}
            onClick={() => void runCommand(command, { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      {children ?? <p>{title}</p>}
    </FrameDialog>
  );
}

export function GenerateCsrDialog() {
  return <SignDialog id="dialog.generate-csr" title="Generate CSR" command="generateCsr" />;
}

export function SignCsrDialog() {
  return <SignDialog id="dialog.sign-csr" title="Sign CSR" command="signCsr" />;
}

export function SignFileDialog() {
  return <SignDialog id="dialog.sign-file" title="Sign File" command="signFile" />;
}

export function SignJarDialog() {
  return <SignDialog id="dialog.sign-jar" title="Sign JAR" command="signJar" />;
}

export function SignJwtDialog() {
  return <SignDialog id="dialog.sign-jwt" title="Sign JWT" command="signJwt" />;
}

export function SignCrlDialog() {
  return <SignDialog id="dialog.sign-crl" title="Sign CRL" command="signCrl" />;
}

export function SignMidletDialog() {
  return <SignDialog id="dialog.sign-midlet" title="Sign MIDlet" command="signMidlet" />;
}

export function ViewJwtDialog() {
  return (
    <FrameDialog
      id="dialog.view-jwt"
      title="Signed JWT"
      open
      actions={
        <button
          type="button"
          data-testid="dialog.view-jwt.ok"
          onClick={() => void runCommand("signJwt", { dismiss: true })}
        >
          OK
        </button>
      }
    >
      <pre className="field">{getLastJwt()}</pre>
    </FrameDialog>
  );
}
