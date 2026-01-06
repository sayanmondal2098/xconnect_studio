import React from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export function Toast(props: {
  text: string;
  kind?: "success" | "info" | "warn";
  onClose?: () => void;
}) {
  const kind = props.kind ?? "success";
  const Icon = kind === "success" ? CheckCircle2 : kind === "warn" ? AlertTriangle : Info;

  return (
    <div className="fixed top-4 right-4 z-50 toast-pop">
      <div className="rounded-xl2 border border-border bg-panel shadow-soft px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[420px]">
        <Icon className={["w-5 h-5 mt-0.5", kind === "success" ? "text-success" : kind === "warn" ? "text-peach" : "text-sky"].join(" ")} />
        <div className="text-sm text-text leading-snug">{props.text}</div>
        {props.onClose ? (
          <button className="btn ml-auto" type="button" onClick={props.onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
