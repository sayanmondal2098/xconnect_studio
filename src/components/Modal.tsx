import React from "react";
import { X } from "lucide-react";

export function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  canClose?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!props.open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && props.canClose && props.onClose) props.onClose();
    };
    window.addEventListener("keydown", onKey);

    // lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [props.open, props.canClose, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop blocks all clicks behind it */}
      <div
        className="absolute inset-0 anime-backdrop"
        onClick={() => {
          if (props.canClose && props.onClose) props.onClose();
        }}
      />

      <div
        className="relative w-full max-w-2xl rounded-xl2 border border-border bg-panel shadow-soft modal-pop overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-text font-semibold text-lg leading-tight">{props.title}</div>
              {props.subtitle ? <div className="text-sm text-muted mt-1">{props.subtitle}</div> : null}
            </div>

            {props.canClose && props.onClose ? (
              <button className="btn" onClick={props.onClose} type="button" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-4">{props.children}</div>
        </div>

        {props.footer ? <div className="px-5 py-4 border-t border-border bg-panel/40">{props.footer}</div> : null}
      </div>
    </div>
  );
}

export function Typewriter(props: { text: string; speedMs?: number; className?: string }) {
  const speed = props.speedMs ?? 18;
  const [out, setOut] = React.useState("");

  React.useEffect(() => {
    setOut("");
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setOut(props.text.slice(0, i));
      if (i >= props.text.length) clearInterval(t);
    }, speed);

    return () => clearInterval(t);
  }, [props.text, speed]);

  return <div className={props.className}>{out}</div>;
}
