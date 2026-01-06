import React from "react";

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-muted mb-1">{props.label}</div>
      <input
        className="w-full rounded-xl2 bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-lavender/60"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        type={props.type ?? "text"}
        autoComplete="off"
      />
    </label>
  );
}
