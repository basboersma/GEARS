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
// biome-ignore-all lint/a11y/noAutofocus: Preserves the reference dashboard rename workflow.
import { useCallback, useEffect, useRef, useState } from "react";
import { FILE_TREE } from "./data";
import type { FileTreeNode } from "./types";

// ─── Tree utilities ───────────────────────────────────────────────────────────

function findNode(nodes: FileTreeNode[], id: string): FileTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) {
      return n;
    }
    if (n.kind === "folder") {
      const f = findNode(n.children, id);
      if (f) {
        return f;
      }
    }
  }
  return null;
}

function removeNode(nodes: FileTreeNode[], id: string): FileTreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.kind === "folder" ? { ...n, children: removeNode(n.children, id) } : n
    );
}

function addToFolder(
  nodes: FileTreeNode[],
  folderId: string | null,
  node: FileTreeNode
): FileTreeNode[] {
  if (folderId === null) {
    return [...nodes, node];
  }
  return nodes.map((n) =>
    n.kind === "folder"
      ? n.id === folderId
        ? { ...n, children: [...n.children, node] }
        : { ...n, children: addToFolder(n.children, folderId, node) }
      : n
  );
}

function renameNode(
  nodes: FileTreeNode[],
  id: string,
  name: string
): FileTreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) {
      return { ...n, name };
    }
    if (n.kind === "folder") {
      return { ...n, children: renameNode(n.children, id, name) };
    }
    return n;
  });
}

function getAllFolders(
  nodes: FileTreeNode[],
  depth = 0
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const n of nodes) {
    if (n.kind === "folder") {
      result.push({ id: n.id, name: n.name, depth });
      result.push(...getAllFolders(n.children, depth + 1));
    }
  }
  return result;
}

function matchesSearch(node: FileTreeNode, q: string): boolean {
  if (!q) {
    return true;
  }
  if (node.name.toLowerCase().includes(q.toLowerCase())) {
    return true;
  }
  if (node.kind === "folder") {
    return node.children.some((c) => matchesSearch(c, q));
  }
  return false;
}

const FILE_ICON: Record<string, string> = {
  pdf: "PDF",
  doc: "DOC",
  sheet: "XLS",
  slide: "PPT",
  other: "···",
};
const FILE_COLOR: Record<string, string> = {
  pdf: "text-[#F0684D]",
  doc: "text-blue-400",
  sheet: "text-emerald-400",
  slide: "text-amber-400",
  other: "text-[#C4A882]",
};

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Context menu ─────────────────────────────────────────────────────────────

interface MenuState {
  nodeId: string;
  x: number;
  y: number;
}

function ContextMenu({
  menu,
  tree,
  onRename,
  onMove,
  onDelete,
  onClose,
}: {
  menu: MenuState;
  tree: FileTreeNode[];
  onRename: () => void;
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [showMove, setShowMove] = useState(false);
  const folders = getAllFolders(tree);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed z-[100] min-w-[140px] overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-2xl"
      ref={ref}
      style={{ top: menu.y, left: menu.x }}
    >
      {showMove ? (
        <>
          <button
            className="flex w-full items-center gap-1 px-3 py-2 text-left text-[#7A6555] text-[9px] hover:text-[#C4A882]"
            onClick={() => setShowMove(false)}
          >
            ← Back
          </button>
          <div className="mx-2 mb-1 h-px bg-[#3D3330]" />
          <button
            className="w-full px-3 py-2 text-left text-[#C4A882] text-xs transition-colors hover:bg-[#2A2724] hover:text-[#FFEDD1]"
            onClick={() => {
              onMove(null);
              onClose();
            }}
          >
            / Root
          </button>
          {folders.map((f) => (
            <button
              className="w-full px-3 py-2 text-left text-[#C4A882] text-xs transition-colors hover:bg-[#2A2724] hover:text-[#FFEDD1]"
              key={f.id}
              onClick={() => {
                onMove(f.id);
                onClose();
              }}
              style={{ paddingLeft: 12 + f.depth * 10 }}
            >
              {f.name}
            </button>
          ))}
        </>
      ) : (
        <>
          <button
            className="w-full px-3 py-2 text-left text-[#C4A882] text-xs transition-colors hover:bg-[#2A2724] hover:text-[#FFEDD1]"
            onClick={onRename}
          >
            Rename
          </button>
          <button
            className="w-full px-3 py-2 text-left text-[#C4A882] text-xs transition-colors hover:bg-[#2A2724] hover:text-[#FFEDD1]"
            onClick={() => setShowMove(true)}
          >
            Move to folder
          </button>
          <div className="mx-2 h-px bg-[#3D3330]" />
          <button
            className="w-full px-3 py-2 text-left text-[#F0684D] text-xs transition-colors hover:bg-[#F0684D]/10"
            onClick={onDelete}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  q,
  open,
  onToggle,
  draggingId,
  onDragStart,
  onDrop,
  onLocalDrop,
  renamingId,
  onRenameCommit,
  onMenuOpen,
}: {
  node: FileTreeNode;
  depth: number;
  q: string;
  open: boolean;
  onToggle: () => void;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (targetFolderId: string) => void;
  onLocalDrop: (folderId: string, files: FileList) => void;
  renamingId: string | null;
  onRenameCommit: (id: string, name: string) => void;
  onMenuOpen: (nodeId: string, x: number, y: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const indent = depth * 14;

  if (!matchesSearch(node, q)) {
    return null;
  }

  if (node.kind === "file") {
    return (
      <div
        className={`group flex cursor-grab select-none items-center gap-2 rounded-lg py-1 transition-colors hover:bg-[#2A2724] ${draggingId === node.id ? "opacity-40" : ""}`}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(node.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        style={{ paddingLeft: indent + 8, paddingRight: 6 }}
      >
        {renamingId === node.id ? (
          <input
            autoFocus
            className="flex-1 rounded border border-[#F0684D] bg-[#141212] px-1.5 text-[#FFEDD1] text-xs outline-none"
            defaultValue={node.name}
            onBlur={(e) => onRenameCommit(node.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRenameCommit(node.id, (e.target as HTMLInputElement).value);
              }
              if (e.key === "Escape") {
                onRenameCommit(node.id, node.name);
              }
            }}
          />
        ) : (
          <>
            <span
              className={`w-6 shrink-0 font-bold text-[9px] ${FILE_COLOR[node.type]}`}
            >
              {FILE_ICON[node.type]}
            </span>
            <span className="flex-1 truncate text-[#C4A882] text-[11px] transition-colors group-hover:text-[#FFEDD1]">
              {node.name}
            </span>
            <span className="mr-1 shrink-0 text-[#4A3F38] text-[9px] opacity-0 transition-opacity group-hover:opacity-100">
              {node.size}
            </span>
            <button
              className="shrink-0 px-1 text-[#7A6555] text-sm leading-none opacity-0 transition-opacity hover:text-[#FFEDD1] group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onMenuOpen(node.id, r.left - 144, r.bottom + 4);
              }}
            >
              ···
            </button>
          </>
        )}
      </div>
    );
  }

  // Folder
  return (
    <div>
      <div
        className={`group flex cursor-pointer select-none items-center gap-2 rounded-lg py-1 transition-colors ${dragOver ? "bg-[#F0684D]/10 ring-1 ring-[#F0684D]/40" : "hover:bg-[#2A2724]"}`}
        onClick={onToggle}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            onLocalDrop(node.id, e.dataTransfer.files);
          } else {
            onDrop(node.id);
          }
        }}
        style={{ paddingLeft: indent + 8, paddingRight: 6 }}
      >
        <span
          className="w-3 shrink-0 text-[#7A6555] text-[9px] transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ▶
        </span>
        <svg
          className="h-3.5 w-3.5 shrink-0 text-[#FFD142]/70"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        {renamingId === node.id ? (
          <input
            autoFocus
            className="flex-1 rounded border border-[#F0684D] bg-[#141212] px-1.5 text-[#FFEDD1] text-xs outline-none"
            defaultValue={node.name}
            onBlur={(e) => onRenameCommit(node.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRenameCommit(node.id, (e.target as HTMLInputElement).value);
              }
              if (e.key === "Escape") {
                onRenameCommit(node.id, node.name);
              }
            }}
          />
        ) : (
          <>
            <span className="flex-1 truncate font-medium text-[#FFEDD1] text-[11px]">
              {node.name}
            </span>
            <span className="shrink-0 text-[#4A3F38] text-[9px] opacity-0 transition-opacity group-hover:opacity-60">
              {node.children.length}
            </span>
            <button
              className="shrink-0 px-1 text-[#7A6555] text-sm leading-none opacity-0 transition-opacity hover:text-[#FFEDD1] group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onMenuOpen(node.id, r.left - 144, r.bottom + 4);
              }}
            >
              ···
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-[#3D3330]"
            style={{ left: indent + 16 }}
          />
          {node.children.map((child) => (
            <ConnectedTreeNode
              depth={depth + 1}
              draggingId={draggingId}
              key={child.id}
              node={child}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onLocalDrop={onLocalDrop}
              onMenuOpen={onMenuOpen}
              onRenameCommit={onRenameCommit}
              q={q}
              renamingId={renamingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper that manages own open state per node
function ConnectedTreeNode(
  props: Omit<Parameters<typeof TreeNode>[0], "open" | "onToggle">
) {
  const [open, setOpen] = useState(props.depth === 0);
  return (
    <TreeNode {...props} onToggle={() => setOpen((o) => !o)} open={open} />
  );
}

// ─── FilesBlock ───────────────────────────────────────────────────────────────

export function FilesBlock() {
  const [tree, setTree] = useState<FileTreeNode[]>(FILE_TREE);
  const [q, setQ] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);

  const handleDrop = useCallback(
    (targetFolderId: string) => {
      if (!draggingId || draggingId === targetFolderId) {
        setDraggingId(null);
        return;
      }
      const node = findNode(tree, draggingId);
      if (!node) {
        setDraggingId(null);
        return;
      }
      setTree((t) =>
        addToFolder(removeNode(t, draggingId), targetFolderId, node)
      );
      setDraggingId(null);
    },
    [draggingId, tree]
  );

  const handleLocalDrop = useCallback(
    (folderId: string | null, files: FileList) => {
      const newNodes: FileTreeNode[] = Array.from(files).map((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        const type =
          ext === "pdf"
            ? "pdf"
            : ext === "doc" || ext === "docx"
              ? "doc"
              : ext === "xls" || ext === "xlsx"
                ? "sheet"
                : ext === "ppt" || ext === "pptx"
                  ? "slide"
                  : "other";
        const size =
          f.size > 1_048_576
            ? `${(f.size / 1_048_576).toFixed(1)} MB`
            : `${Math.round(f.size / 1024)} KB`;
        return {
          kind: "file" as const,
          id: uid(),
          name: f.name,
          type,
          size,
          modified: "Just now",
          url: "#",
        };
      });
      setTree((t) =>
        newNodes.reduce((acc, node) => addToFolder(acc, folderId, node), t)
      );
    },
    []
  );

  const handleMove = useCallback(
    (nodeId: string, folderId: string | null) => {
      const node = findNode(tree, nodeId);
      if (!node) {
        return;
      }
      setTree((t) => addToFolder(removeNode(t, nodeId), folderId, node));
    },
    [tree]
  );

  const handleRenameCommit = useCallback((id: string, name: string) => {
    if (name.trim()) {
      setTree((t) => renameNode(t, id, name.trim()));
    }
    setRenamingId(null);
  }, []);

  const handleDelete = useCallback((nodeId: string) => {
    setTree((t) => removeNode(t, nodeId));
    setMenu(null);
  }, []);

  const menuNodeId = menu?.nodeId ?? null;

  return (
    <div className="flex h-full flex-col" onDragEnd={() => setDraggingId(null)}>
      <h2 className="mb-2 shrink-0 font-semibold text-[#FFEDD1] text-sm">
        Files
      </h2>
      <div className="relative mb-2 shrink-0">
        <input
          className="w-full rounded-lg border border-[#3D3330] bg-[#232120] py-1.5 pr-3 pl-3 text-[#FFEDD1] text-xs transition-colors placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files…"
          value={q}
        />
      </div>

      {/* Tree */}
      <div className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
        {tree.map((node) => (
          <ConnectedTreeNode
            depth={0}
            draggingId={draggingId}
            key={node.id}
            node={node}
            onDragStart={setDraggingId}
            onDrop={handleDrop}
            onLocalDrop={handleLocalDrop}
            onMenuOpen={(nodeId, x, y) => {
              setMenu({ nodeId, x, y });
            }}
            onRenameCommit={handleRenameCommit}
            q={q}
            renamingId={renamingId}
          />
        ))}
      </div>

      {/* Root drop zone for local files */}
      <div
        className={`mt-2 shrink-0 rounded-xl border border-dashed py-2 text-center text-[9px] transition-colors ${rootDragOver ? "border-[#F0684D] bg-[#F0684D]/8 text-[#F0684D]" : "border-[#3D3330] text-[#4A3F38]"}`}
        onDragLeave={() => setRootDragOver(false)}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) {
            setRootDragOver(true);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setRootDragOver(false);
          if (e.dataTransfer.files.length) {
            handleLocalDrop(null, e.dataTransfer.files);
          }
        }}
      >
        Drop file here to add to root
      </div>

      {/* Context menu */}
      {menu && menuNodeId && (
        <ContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onDelete={() => handleDelete(menuNodeId)}
          onMove={(folderId) => handleMove(menuNodeId, folderId)}
          onRename={() => {
            setRenamingId(menuNodeId);
            setMenu(null);
          }}
          tree={tree}
        />
      )}
    </div>
  );
}
