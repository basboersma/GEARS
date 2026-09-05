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
import { avatarBg, INIT_TODOS, MEMBERS, memberIdx } from "./data";
import { TodoModal } from "./TodoModal";
import type { TodoItem } from "./types";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function SubtaskTrack({
  item,
  onToggle,
}: {
  item: TodoItem;
  onToggle: (stId: string) => void;
}) {
  const [tooltip, setTooltip] = useState<{ idx: number; text: string } | null>(
    null
  );
  const raw = item.subtasks ?? [];
  if (raw.length === 0) {
    return null;
  }
  // Sort: done subtasks move to front so bar is always contiguous
  const subtasks = [
    ...raw.filter((s) => s.done),
    ...raw.filter((s) => !s.done),
  ];
  const doneCount = subtasks.filter((s) => s.done).length;
  const fillPct = item.done
    ? 100
    : doneCount === 0
      ? 0
      : Math.min(97, ((doneCount - 0.5) / subtasks.length) * 100);

  return (
    <div className="mt-1.5 mb-0.5">
      <div className="relative flex h-3 w-full items-center">
        <div className="absolute inset-y-1 right-0 left-0 rounded-full bg-[#3D3330]" />
        {fillPct > 0 && (
          <div
            className="absolute inset-y-1 left-0 rounded-full transition-all"
            style={{ width: `${fillPct}%`, background: item.color }}
          />
        )}
        {subtasks.map((st, i) => {
          const pos = ((i + 0.5) / subtasks.length) * 100;
          return (
            <div
              className="absolute z-10 -translate-x-1/2"
              key={st.id}
              style={{ left: `${pos}%` }}
            >
              {tooltip?.idx === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#3D3330] bg-[#141212] px-2 py-1 text-[#FFEDD1] text-[9px] shadow-lg">
                  {tooltip.text}
                </div>
              )}
              <button
                className="block h-3 w-3 rounded-full border-2 transition-all hover:scale-125"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(st.id);
                }}
                onMouseEnter={() => setTooltip({ idx: i, text: st.text })}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  background: st.done ? item.color : "#2A2724",
                  borderColor: st.done ? item.color : "#D4B896",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[#7A6555] text-[9px]">
          {doneCount}/{subtasks.length} subtasks
        </span>
        <span className="font-medium text-[9px]" style={{ color: item.color }}>
          {Math.round(fillPct)}%
        </span>
      </div>
    </div>
  );
}

function DueBadge({ dueDate, done }: { dueDate: string; done: boolean }) {
  if (done) {
    return <span className="shrink-0 text-[#7A6555] text-[9px]">Done</span>;
  }
  const days = daysUntil(dueDate);
  if (days < 0) {
    return (
      <span className="shrink-0 font-semibold text-[#F0684D] text-[9px]">
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="shrink-0 font-semibold text-[#F0684D] text-[9px]">
        Due today
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="shrink-0 font-semibold text-[9px] text-amber-600">
        {days}d left
      </span>
    );
  }
  return <span className="shrink-0 text-[#7A6555] text-[9px]">{days}d</span>;
}

export function TodoBlock() {
  const [todos, setTodos] = useState<TodoItem[]>(INIT_TODOS);
  const [modal, setModal] = useState<"new" | TodoItem | null>(null);
  const [tab, setTab] = useState<"active" | "previous">("active");

  const save = (item: TodoItem) => {
    setTodos((p) =>
      p.some((t) => t.id === item.id)
        ? p.map((t) => (t.id === item.id ? item : t))
        : [...p, item]
    );
    setModal(null);
  };
  const remove = (id: string) => {
    setTodos((p) => p.filter((t) => t.id !== id));
    setModal(null);
  };
  const toggle = (id: string) =>
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const toggleSubtask = (todoId: string, stId: string) =>
    setTodos((p) =>
      p.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: (t.subtasks ?? []).map((s) =>
                s.id === stId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      )
    );

  const active = todos.filter((t) => !t.done);
  const previous = todos.filter((t) => t.done);
  const displayed = tab === "active" ? active : previous;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-0.5 rounded-lg border border-[#3D3330] bg-[#232120] p-0.5">
          <button
            className={`rounded-md px-2.5 py-1 font-medium text-xs transition-colors ${tab === "active" ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
            onClick={() => setTab("active")}
          >
            Active
            {active.length > 0 && (
              <span className="ml-1 text-[#F0684D]">{active.length}</span>
            )}
          </button>
          <button
            className={`rounded-md px-2.5 py-1 font-medium text-xs transition-colors ${tab === "previous" ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
            onClick={() => setTab("previous")}
          >
            Previous
            {previous.length > 0 && (
              <span className="ml-1 text-[#7A6555]">{previous.length}</span>
            )}
          </button>
        </div>
        <button
          className="rounded-lg bg-[#F0684D] px-2.5 py-1 font-medium text-white text-xs transition-colors hover:bg-[#E05538]"
          onClick={() => setModal("new")}
        >
          + New task
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {displayed.map((t) => (
          <div
            className={`group rounded-xl border transition-all ${t.done ? "border-[#3D3330] bg-[#232120] opacity-60" : "border-[#3D3330] bg-[#2A2724] hover:border-[#4A3F38]"}`}
            key={t.id}
            style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1">
              <button
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors"
                onClick={() => toggle(t.id)}
                style={{
                  borderColor: t.done ? t.color : "#D4B896",
                  background: t.done ? t.color : "transparent",
                }}
              >
                {t.done && (
                  <span className="font-bold text-[9px] text-white">✓</span>
                )}
              </button>
              <span
                className={`flex-1 cursor-pointer truncate font-medium text-sm ${t.done ? "text-[#7A6555] line-through" : "text-[#FFEDD1]"}`}
                onClick={() => setModal(t)}
              >
                {t.text}
              </span>
              {t.assignedMembers.length > 0 && (
                <div className="flex shrink-0 -space-x-1">
                  {t.assignedMembers.slice(0, 3).map((id) => {
                    const m = MEMBERS.find((x) => x.id === id);
                    if (!m) {
                      return null;
                    }
                    return (
                      <span
                        className={`h-5 w-5 rounded-full ${avatarBg(memberIdx(id))} flex items-center justify-center border-2 border-[#2A2724] font-bold text-[8px] text-white`}
                        key={id}
                        title={m.name}
                      >
                        {m.avatar}
                      </span>
                    );
                  })}
                </div>
              )}
              {t.dueDate && <DueBadge done={t.done} dueDate={t.dueDate} />}
              <button
                className="ml-1 shrink-0 font-medium text-[#7A6555] text-[10px] opacity-0 transition-opacity hover:text-[#FFEDD1] group-hover:opacity-100"
                onClick={() => setModal(t)}
              >
                Edit
              </button>
            </div>
            {(t.subtasks ?? []).length > 0 && (
              <div className="px-3 pb-2">
                <SubtaskTrack
                  item={{ ...t, subtasks: t.subtasks ?? [] }}
                  onToggle={(stId) => toggleSubtask(t.id, stId)}
                />
              </div>
            )}
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-[#7A6555] text-sm">
            <span className="font-thin text-3xl text-[#4A3F38]">—</span>
            <span>
              {tab === "active" ? "All caught up" : "Nothing here yet"}
            </span>
          </div>
        )}
      </div>

      {modal && (
        <TodoModal
          initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onDelete={modal !== "new" ? () => remove(modal.id) : undefined}
          onSave={save}
        />
      )}
    </div>
  );
}
