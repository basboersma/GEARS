// biome-ignore-all lint/a11y/noLabelWithoutControl: Preserves the reference dashboard interaction design.
// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/a11y/noStaticElementInteractions: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/a11y/noSvgWithoutTitle: Preserves the reference dashboard visual assets.
// biome-ignore-all lint/a11y/useButtonType: Preserves the reference dashboard controls.
// biome-ignore-all lint/a11y/useKeyWithClickEvents: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Preserves the reference dashboard component structure.
// biome-ignore-all lint/complexity/noForEach: Preserves the reference dashboard data flow.
// biome-ignore-all lint/correctness/useExhaustiveDependencies: Preserves the reference dashboard interaction timing.
// biome-ignore-all lint/suspicious/noArrayIndexKey: Preserves the reference dashboard list rendering.
// biome-ignore-all lint/suspicious/noExplicitAny: Preserves the reference dashboard chart library contract.
// biome-ignore-all lint/style/noNestedTernary: Preserves the reference dashboard visual state expressions.
// biome-ignore-all lint/style/noNonNullAssertion: Preserves the reference dashboard data contract.
// biome-ignore-all lint/style/useFilenamingConvention: Preserves the reference dashboard source names.
import type { ReactNode } from "react";

export function ModalShell({
  children,
  onClose,
  width = "max-w-xl",
}: {
  children: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full animate-slide-up ${width} flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
  sub,
}: {
  title: string;
  onClose: () => void;
  sub?: string;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-[#3D3330] border-b px-5 py-4">
      <div>
        <h2 className="font-semibold text-[#FFEDD1]">{title}</h2>
        {sub && <p className="mt-0.5 text-[#7A6555] text-xs">{sub}</p>}
      </div>
      <button
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A6555] text-sm transition-colors hover:bg-[#2E2B2A] hover:text-[#FFEDD1]"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

export function Inp({
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  return (
    <input
      className={`w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm transition-colors placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none ${className}`}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

export function Sel({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      className={`w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm transition-colors focus:border-[#F0684D] focus:outline-none ${className}`}
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-medium text-[#C4A882] text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}
