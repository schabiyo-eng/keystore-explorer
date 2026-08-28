import { useRef } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { getLastJwt } from "./clipboard";
import {
  GENERATE_CSR_DIALOG,
  SIGN_CRL_DIALOG,
  SIGN_CSR_DIALOG,
  SIGN_FILE_DIALOG,
  SIGN_JAR_DIALOG,
  SIGN_JWT_DIALOG,
  SIGN_MIDLET_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import { Field, SignFormDialog } from "./fields";
import { commandParams, omitEmpty } from "./params";

function selectedRadio(name: string): string | undefined {
  const node = document.querySelector(`input[name="${name}"]:checked`);
  return node instanceof HTMLInputElement ? node.value : undefined;
}

export function GenerateCsrDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={GENERATE_CSR_DIALOG}
      title="Generate CSR"
      command="generateCsr"
      onOk={() =>
        void runCommand(
          "generateCsr",
          commandParams({
            path: omitEmpty(pathRef.current?.value),
            format: selectedRadio("generate-csr-format") ?? "PKCS10",
          }),
        )
      }
    >
      <fieldset className="type-radios">
        <legend>Format</legend>
        <label>
          <input
            type="radio"
            name="generate-csr-format"
            value="PKCS10"
            defaultChecked
          />
          PKCS #10
        </label>
        <label>
          <input type="radio" name="generate-csr-format" value="SPKAC" disabled />
          SPKAC
        </label>
      </fieldset>
      <label className="field" htmlFor={`${GENERATE_CSR_DIALOG}.algorithm`}>
        <span>Signature Algorithm</span>
        <select id={`${GENERATE_CSR_DIALOG}.algorithm`} defaultValue="SHA256withRSA">
          <option value="SHA256withRSA">SHA-256 with RSA</option>
        </select>
      </label>
      <Field id={`${GENERATE_CSR_DIALOG}.path`} label="CSR File" inputRef={pathRef} />
    </SignFormDialog>
  );
}

export function SignCsrDialog() {
  const csrRef = useRef<HTMLInputElement>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_CSR_DIALOG}
      title="Sign CSR"
      command="signCsr"
      onOk={() =>
        void runCommand(
          "signCsr",
          commandParams({
            fixture: omitEmpty(csrRef.current?.value),
            path: omitEmpty(pathRef.current?.value),
          }),
        )
      }
    >
      <Field id={`${SIGN_CSR_DIALOG}.csr`} label="CSR File" inputRef={csrRef} />
      <Field id={`${SIGN_CSR_DIALOG}.path`} label="Certificate File" inputRef={pathRef} />
    </SignFormDialog>
  );
}

export function SignFileDialog() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_FILE_DIALOG}
      title="Sign File"
      command="signFile"
      onOk={() =>
        void runCommand(
          "signFile",
          commandParams({
            input: omitEmpty(inputRef.current?.value),
            path: omitEmpty(pathRef.current?.value),
          }),
        )
      }
    >
      <Field id={`${SIGN_FILE_DIALOG}.input`} label="Input File" inputRef={inputRef} />
      <Field id={`${SIGN_FILE_DIALOG}.path`} label="Output File" inputRef={pathRef} />
    </SignFormDialog>
  );
}

export function SignJarDialog() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_JAR_DIALOG}
      title="Sign JAR"
      command="signJar"
      onOk={() =>
        void runCommand(
          "signJar",
          commandParams({
            input: omitEmpty(inputRef.current?.value),
            path: omitEmpty(pathRef.current?.value),
          }),
        )
      }
    >
      <fieldset className="type-radios">
        <legend>Output</legend>
        <label>
          <input type="radio" name="sign-jar-output" value="direct" defaultChecked />
          Sign Directly
        </label>
        <label>
          <input type="radio" name="sign-jar-output" value="copy" />
          Set Output File Name(s)
        </label>
      </fieldset>
      <Field id={`${SIGN_JAR_DIALOG}.input`} label="Input JAR(s)" inputRef={inputRef} />
      <Field id={`${SIGN_JAR_DIALOG}.path`} label="Output JAR" inputRef={pathRef} />
    </SignFormDialog>
  );
}

export function SignJwtDialog() {
  const subjectRef = useRef<HTMLInputElement>(null);
  const issuerRef = useRef<HTMLInputElement>(null);
  const audienceRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_JWT_DIALOG}
      title="Sign JWT"
      command="signJwt"
      onOk={() => {
        const subject = omitEmpty(subjectRef.current?.value);
        const issuer = omitEmpty(issuerRef.current?.value);
        const audience = omitEmpty(audienceRef.current?.value);
        const claims =
          subject || issuer || audience
            ? {
                ...(subject ? { subject } : {}),
                ...(issuer ? { issuer } : {}),
                ...(audience ? { audience } : {}),
              }
            : undefined;
        void runCommand("signJwt", commandParams({ claims }));
      }}
    >
      <label className="field" htmlFor={`${SIGN_JWT_DIALOG}.algorithm`}>
        <span>Signature Algorithm</span>
        <select id={`${SIGN_JWT_DIALOG}.algorithm`} defaultValue="RS256">
          <option value="RS256">RS256</option>
        </select>
      </label>
      <Field id={`${SIGN_JWT_DIALOG}.subject`} label="Subject" inputRef={subjectRef} />
      <Field id={`${SIGN_JWT_DIALOG}.issuer`} label="Issuer" inputRef={issuerRef} />
      <Field id={`${SIGN_JWT_DIALOG}.audience`} label="Audience" inputRef={audienceRef} />
    </SignFormDialog>
  );
}

export function SignCrlDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_CRL_DIALOG}
      title="Sign CRL"
      command="signCrl"
      onOk={() =>
        void runCommand("signCrl", commandParams({ path: omitEmpty(pathRef.current?.value) }))
      }
    >
      <label className="field" htmlFor={`${SIGN_CRL_DIALOG}.algorithm`}>
        <span>Signature Algorithm</span>
        <select id={`${SIGN_CRL_DIALOG}.algorithm`} defaultValue="SHA256withRSA">
          <option value="SHA256withRSA">SHA-256 with RSA</option>
        </select>
      </label>
      <Field id={`${SIGN_CRL_DIALOG}.path`} label="CRL File" inputRef={pathRef} />
    </SignFormDialog>
  );
}

export function SignMidletDialog() {
  const jadRef = useRef<HTMLInputElement>(null);
  const jarRef = useRef<HTMLInputElement>(null);
  return (
    <SignFormDialog
      id={SIGN_MIDLET_DIALOG}
      title="Sign MIDlet"
      command="signMidlet"
      onOk={() =>
        void runCommand(
          "signMidlet",
          commandParams({
            jad: omitEmpty(jadRef.current?.value),
            jar: omitEmpty(jarRef.current?.value),
          }),
        )
      }
    >
      <Field id={`${SIGN_MIDLET_DIALOG}.jad`} label="Input MIDlet JAD" inputRef={jadRef} />
      <Field id={`${SIGN_MIDLET_DIALOG}.jar`} label="MIDlet JAR" inputRef={jarRef} />
    </SignFormDialog>
  );
}

export function ViewJwtDialog() {
  const encodedId = `${VIEW_JWT_DIALOG}.encoded`;
  return (
    <FrameDialog
      id={VIEW_JWT_DIALOG}
      title="View JWT"
      open
      actions={
        <button
          type="button"
          data-testid={`${VIEW_JWT_DIALOG}.ok`}
          aria-label="OK"
          onClick={() => void runCommand("signJwt", { dismiss: true })}
        >
          OK
        </button>
      }
    >
      <label className="field" htmlFor={encodedId}>
        <span>Encoded</span>
        <textarea
          id={encodedId}
          readOnly
          rows={8}
          cols={48}
          spellCheck={false}
          value={getLastJwt()}
        />
      </label>
    </FrameDialog>
  );
}
