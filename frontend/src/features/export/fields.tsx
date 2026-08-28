import type { Ref } from "react";
import { runCommand } from "../../shell/registry";

export function ExportField({
  id,
  label,
  type = "text",
  inputRef,
}: {
  id: string;
  label: string;
  type?: "text" | "password";
  inputRef: Ref<HTMLInputElement>;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        ref={inputRef}
        type={type}
        autoComplete="off"
        spellCheck={false}
        aria-required="true"
      />
    </label>
  );
}

export function FormatChoice({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; enabled?: boolean }[];
}) {
  const selected = options.find((item) => item.enabled !== false)?.value;
  return (
    <fieldset className="type-radios">
      <legend>{legend}</legend>
      {options.map((option) => {
        const enabled = option.enabled !== false;
        return (
          <label key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={enabled && option.value === selected}
              disabled={!enabled}
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}

export function DialogActions({
  command,
  okId,
  cancelId,
  onOk,
}: {
  command: string;
  okId: string;
  cancelId: string;
  onOk: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={okId} aria-label="OK" onClick={onOk}>
        OK
      </button>
      <button
        type="button"
        data-testid={cancelId}
        aria-label="Cancel"
        onClick={() => void runCommand(command, { cancel: true })}
      >
        Cancel
      </button>
    </>
  );
}
