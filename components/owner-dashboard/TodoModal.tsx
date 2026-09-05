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
import { useState } from "react";
import { avatarBg, FILES, MEMBERS, memberIdx } from "./data";
import { MiniCalPicker } from "./MiniCalPicker";
import { ModalHeader, ModalShell } from "./shared";
import type { Subtask, TodoItem } from "./types";

const TASK_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#4f6ef7",
  "#8b5cf6",
  "#ec4899",
];
const fileIcon = (name: string) =>
  name.endsWith(".pdf")
    ? "📄"
    : name.endsWith(".doc")
      ? "📝"
      : name.endsWith(".sheet")
        ? "📊"
        : name.endsWith(".slide")
          ? "📑"
          : "📁";

interface Props {
  initial?: TodoItem;
  onSave: (item: TodoItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TodoModal({ initial, onSave, onDelete, onClose }: Props) {
  const blank: TodoItem = {
    id: Date.now().toString(),
    text: "",
    description: "",
    done: false,
    color: TASK_COLORS[0],
    assignedMembers: [],
    linkedFiles: [],
    addToCalendar: false,
    calendarDate: "",
    subtasks: [],
  };
  const [item, setItem] = useState<TodoItem>(
    initial ? { ...initial, subtasks: initial.subtasks ?? [] } : blank
  );
  const [mSearch, setMSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [showCal, setShowCal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");

  const set = (patch: Partial<TodoItem>) =>
    setItem((p) => ({ ...p, ...patch }));

  const toggleMember = (id: string) =>
    set({
      assignedMembers: item.assignedMembers.includes(id)
        ? item.assignedMembers.filter((x) => x !== id)
        : [...item.assignedMembers, id],
    });

  const toggleFile = (fid: string) =>
    set({
      linkedFiles: item.linkedFiles.includes(fid)
        ? item.linkedFiles.filter((x) => x !== fid)
        : [...item.linkedFiles, fid],
    });

  const filteredM = MEMBERS.filter(
    (m) =>
      !item.assignedMembers.includes(m.id) &&
      m.name.toLowerCase().includes(mSearch.toLowerCase())
  );
  const filteredFiles = FILES.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    Array.from(e.dataTransfer.files).forEach((f) => {
      const key = `local:${f.name}`;
      if (!item.linkedFiles.includes(key)) {
        set({ linkedFiles: [...item.linkedFiles, key] });
      }
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) {
      return;
    }
    const st: Subtask = {
      id: Date.now().toString(),
      text: newSubtask.trim(),
      done: false,
    };
    set({ subtasks: [...item.subtasks, st] });
    setNewSubtask("");
  };

  const toggleSubtask = (id: string) =>
    set({
      subtasks: item.subtasks.map((s) =>
        s.id === id ? { ...s, done: !s.done } : s
      ),
    });

  const removeSubtask = (id: string) =>
    set({ subtasks: item.subtasks.filter((s) => s.id !== id) });

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader
        onClose={onClose}
        title={initial ? "Edit Task" : "New Task"}
      />

      <div className="flex-1 space-y-4 overflow-auto p-5">
        {/* Color picker */}
        <div className="flex gap-1.5">
          {TASK_COLORS.map((c) => (
            <button
              className="h-5 w-5 rounded-full transition-all hover:scale-110"
              key={c}
              onClick={() => set({ color: c })}
              style={{
                background: c,
                outline: item.color === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <input
          className="w-full border-[#3D3330] border-b-2 bg-transparent px-0 py-1 font-medium text-[#FFEDD1] text-base outline-none transition-colors placeholder:text-[#7A6555] focus:border-[#F0684D]"
          onChange={(e) => set({ text: e.target.value })}
          placeholder="Task title…"
          value={item.text}
        />

        {/* Description */}
        <div>
          <label className="mb-1 block font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
            Description
          </label>
          <textarea
            className="w-full resize-none rounded-xl border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Add details…"
            rows={2}
            value={item.description}
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="mb-2 block font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
            Subtasks
          </label>
          <div className="mb-2 space-y-1">
            {item.subtasks.map((st) => (
              <div className="group flex items-center gap-2" key={st.id}>
                <button
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${st.done ? "border-[#F0684D] bg-[#F0684D]" : "border-[#4a5568]"}`}
                  onClick={() => toggleSubtask(st.id)}
                >
                  {st.done && (
                    <span className="font-bold text-[8px] text-white">✓</span>
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${st.done ? "text-[#7A6555] line-through" : "text-[#FFEDD1]"}`}
                >
                  {st.text}
                </span>
                <button
                  className="text-[#7A6555] text-xs opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                  onClick={() => removeSubtask(st.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-1.5 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask… (Enter)"
              value={newSubtask}
            />
            <button
              className="rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-1.5 text-[#C4A882] text-xs transition-colors hover:border-[#F0684D]/40 hover:text-[#F0684D]"
              onClick={addSubtask}
            >
              +
            </button>
          </div>
        </div>

        {/* Members */}
        <div>
          <label className="mb-2 block font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
            Assigned Members
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {item.assignedMembers.map((id) => {
              const m = MEMBERS.find((x) => x.id === id);
              if (!m) {
                return null;
              }
              return (
                <button
                  className="flex items-center gap-1.5 rounded-full border border-[#3D3330] bg-[#232120] px-2.5 py-1 text-[#FFEDD1] text-xs transition-colors hover:border-rose-400/40 hover:text-rose-400"
                  key={id}
                  onClick={() => toggleMember(id)}
                >
                  <span
                    className={`h-4 w-4 rounded-full ${avatarBg(memberIdx(id))} flex items-center justify-center font-bold text-[8px] text-white`}
                  >
                    {m.avatar}
                  </span>
                  {m.name.split(" ")[0]} ✕
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input
              className="w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
              onChange={(e) => setMSearch(e.target.value)}
              placeholder="Search members…"
              value={mSearch}
            />
            {mSearch && filteredM.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-10 mt-0.5 overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl">
                {filteredM.slice(0, 5).map((m) => (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#232120]"
                    key={m.id}
                    onClick={() => {
                      toggleMember(m.id);
                      setMSearch("");
                    }}
                  >
                    <span
                      className={`h-5 w-5 rounded-full ${avatarBg(memberIdx(m.id))} flex shrink-0 items-center justify-center font-bold text-[9px] text-white`}
                    >
                      {m.avatar}
                    </span>
                    <span className="text-[#FFEDD1] text-sm">{m.name}</span>
                    <span className="ml-auto text-[#7A6555] text-xs">
                      {m.department}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Files */}
        <div>
          <label className="mb-2 block font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
            Files
          </label>
          <div
            className={`mb-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-center text-xs transition-colors ${dragActive ? "border-[#F0684D] bg-[#F0684D]/10 text-[#F0684D]" : "border-[#3D3330] text-[#7A6555]"}`}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDrop={handleDrop}
          >
            📎 Drop files here
          </div>
          <input
            className="mb-2 w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
            onChange={(e) => setFileSearch(e.target.value)}
            placeholder="Search Drive files…"
            value={fileSearch}
          />
          <div className="max-h-24 space-y-1 overflow-auto">
            {filteredFiles.map((f) => (
              <label
                className="group flex cursor-pointer items-center gap-2 py-0.5"
                key={f.id}
              >
                <input
                  checked={item.linkedFiles.includes(f.id)}
                  className="accent-[#F0684D]"
                  onChange={() => toggleFile(f.id)}
                  type="checkbox"
                />
                <span className="truncate text-[#C4A882] text-xs transition-colors group-hover:text-[#FFEDD1]">
                  {fileIcon(f.name)} {f.name}
                </span>
              </label>
            ))}
          </div>
          {item.linkedFiles
            .filter((x) => x.startsWith("local:"))
            .map((x, i) => (
              <div
                className="mt-1 flex items-center gap-2 rounded-lg border border-[#3D3330] bg-[#232120] p-1.5"
                key={i}
              >
                <span className="text-xs">📎</span>
                <span className="flex-1 truncate text-[#FFEDD1] text-xs">
                  {x.replace("local:", "")}
                </span>
                <button
                  className="text-[#7A6555] text-xs hover:text-rose-400"
                  onClick={() =>
                    set({
                      linkedFiles: item.linkedFiles.filter((y) => y !== x),
                    })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[#C4A882] text-sm">
            <input
              checked={item.addToCalendar}
              className="accent-[#F0684D]"
              onChange={(e) => set({ addToCalendar: e.target.checked })}
              type="checkbox"
            />
            📅 Add to calendar
          </label>
          {item.addToCalendar && (
            <div className="relative">
              <button
                className="rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-1.5 text-[#FFEDD1] text-xs transition-colors hover:border-[#F0684D]/40"
                onClick={() => setShowCal(!showCal)}
              >
                {item.calendarDate || "Pick date"}
              </button>
              {showCal && (
                <MiniCalPicker
                  onChange={(v) => {
                    set({ calendarDate: v });
                    setShowCal(false);
                  }}
                  onClose={() => setShowCal(false)}
                  value={item.calendarDate}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-[#3D3330] border-t px-5 py-4">
        {onDelete && (
          <button
            className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-4 py-2 font-medium text-rose-400 text-sm transition-colors hover:bg-rose-500/30"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
        <button
          className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 font-medium text-[#FFEDD1] text-sm transition-colors hover:bg-[#2E2B2A]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 rounded-xl bg-[#F0684D] py-2 font-medium text-sm text-white transition-colors hover:bg-[#E05538]"
          onClick={() => {
            if (item.text.trim()) {
              onSave(item);
            }
          }}
        >
          {initial ? "Save" : "Create"}
        </button>
      </div>
    </ModalShell>
  );
}
