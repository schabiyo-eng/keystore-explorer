import { type ReactNode, type Ref } from "react";
import { runCommand } from "../../shell/registry";

export function DialogField({
  testId,
  label,
  type = "text",
  inputRef,
  defaultValue,
  required,
}: {
  testId: string;
  label: string;
  type?: "text" | "password" | "number";
  inputRef?: Ref<HTMLInputElement>;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="field" htmlFor={testId}>
      <span>{label}</span>
      <input
        id={testId}
        ref={inputRef}
        data-testid={testId}
        type={type}
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
        aria-required={required || undefined}
      />
    </label>
  );
}

export function DialogSelect({
  id,
  label,
  selectRef,
  defaultValue,
  children,
}: {
  id: string;
  label: string;
  selectRef?: Ref<HTMLSelectElement>;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} ref={selectRef} defaultValue={defaultValue} aria-label={label}>
        {children}
      </select>
    </label>
  );
}

export function RadioOption({
  name,
  testId,
  value,
  label,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  testId: string;
  value: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={testId}>
      <input
        id={testId}
        type="radio"
        name={name}
        data-testid={testId}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
}

export function OkCancelButtons({
  dialogId,
  command,
  onOk,
}: {
  dialogId: string;
  command: string;
  onOk: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={`${dialogId}.ok`} aria-label="OK" onClick={onOk}>
        OK
      </button>
      <button
        type="button"
        data-testid={`${dialogId}.cancel`}
        aria-label="Cancel"
        onClick={() => void runCommand(command, { cancel: true })}
      >
        Cancel
      </button>
    </>
  );
}
