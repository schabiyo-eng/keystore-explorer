import type { ReactNode } from "react";

interface FrameDialogProps {
  id: string;
  title: string;
  open: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}

/** One modal chrome used by every File-slice dialog. Features do not invent portals. */
export function FrameDialog({ id, title, open, children, actions }: FrameDialogProps) {
  const titleId = `${id}-title`;
  return (
    <div
      data-testid={id}
      hidden={!open}
      className="dialog"
      role="dialog"
      aria-modal={open}
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions ? <div className="dialog-actions">{actions}</div> : null}
    </div>
  );
}
