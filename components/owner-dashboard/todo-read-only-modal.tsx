"use client";

import { useDashboardData } from "./dashboard-data-context";
import { ModalHeader, ModalShell } from "./shared";
import type { TodoItem } from "./types";

function formatFileType(type: string) {
  return type === "other" ? "File" : type.toUpperCase();
}

export function TodoReadOnlyModal({
  todo,
  onClose,
}: {
  todo: TodoItem;
  onClose: () => void;
}) {
  const { files, members } = useDashboardData();
  const linkedFiles = todo.linkedFileDetails?.length
    ? todo.linkedFileDetails
    : todo.linkedFiles
        .map((fileId) => files.find((file) => file.id === fileId))
        .filter((file): file is NonNullable<typeof file> => Boolean(file));
  const localFiles = todo.linkedFiles
    .filter((fileId) => fileId.startsWith("local:"))
    .map((fileId) => fileId.replace("local:", ""));

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader onClose={onClose} title="Task details" />
      <div className="flex-1 space-y-4 overflow-auto p-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ background: todo.color }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#FFEDD1] text-lg">
              {todo.text}
            </h2>
            <p className="mt-1 text-[#9C8272] text-xs">
              {todo.done ? "Completed" : "Active"}
              {todo.dueDate ? ` · Due ${todo.dueDate}` : ""}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#3D3330] bg-[#232120] p-3">
          <div className="mb-1 font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
            Description
          </div>
          <p className="whitespace-pre-wrap text-[#C4A882] text-sm">
            {todo.description || "No description provided."}
          </p>
        </div>

        <div>
          <div className="mb-2 font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
            Assigned members
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todo.assignedMembers.map((memberId) => {
              const member = members.find((entry) => entry.id === memberId);
              return (
                <span
                  className="rounded-full border border-[#3D3330] bg-[#232120] px-2.5 py-1 text-[#FFEDD1] text-xs"
                  key={memberId}
                >
                  {member?.name ?? "Unknown member"}
                </span>
              );
            })}
            {todo.assignedMembers.length === 0 && (
              <span className="text-[#7A6555] text-xs">
                No assigned members
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
            Subtasks ({todo.subtasks.length})
          </div>
          <div className="space-y-1.5">
            {todo.subtasks.map((subtask) => (
              <div
                className="flex items-center gap-2 rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2"
                key={subtask.id}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${subtask.done ? "border-[#10b981] bg-[#10b981] text-white" : "border-[#7A6555] text-transparent"}`}
                >
                  ✓
                </span>
                <span
                  className={`text-sm ${subtask.done ? "text-[#7A6555] line-through" : "text-[#FFEDD1]"}`}
                >
                  {subtask.text}
                </span>
              </div>
            ))}
            {todo.subtasks.length === 0 && (
              <span className="text-[#7A6555] text-xs">No subtasks</span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
            Files ({linkedFiles.length + localFiles.length})
          </div>
          <div className="space-y-1.5">
            {linkedFiles.map((file) => (
              <a
                className="flex items-center gap-3 rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 hover:border-[#4A3F38]"
                href={file.url}
                key={file.id}
                rel="noreferrer"
                target="_blank"
              >
                <span className="w-10 shrink-0 font-mono text-[#F0684D] text-[9px]">
                  {formatFileType(file.type)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[#FFEDD1] text-xs">
                  {file.name}
                </span>
                <span className="shrink-0 text-[#7A6555] text-[10px]">
                  {file.size || ""}
                </span>
              </a>
            ))}
            {localFiles.map((fileName) => (
              <div
                className="flex items-center gap-3 rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2"
                key={fileName}
              >
                <span className="w-10 shrink-0 font-mono text-[#F0684D] text-[9px]">
                  FILE
                </span>
                <span className="truncate text-[#FFEDD1] text-xs">
                  {fileName}
                </span>
              </div>
            ))}
            {linkedFiles.length === 0 && localFiles.length === 0 && (
              <span className="text-[#7A6555] text-xs">No files attached</span>
            )}
          </div>
        </div>

        {todo.addToCalendar && (
          <div className="rounded-xl border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#C4A882] text-xs">
            Added to calendar
            {todo.calendarDate ? ` on ${todo.calendarDate}` : ""}
          </div>
        )}
      </div>
      <div className="flex shrink-0 border-[#3D3330] border-t px-5 py-4">
        <button
          className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 font-medium text-[#FFEDD1] text-sm hover:bg-[#2E2B2A]"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}
