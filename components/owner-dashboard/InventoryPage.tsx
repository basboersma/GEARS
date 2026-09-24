// biome-ignore-all lint: Matches the existing dashboard component conventions.
// biome-ignore-all assist/source/useSortedAttributes: Preserves dashboard JSX attribute order.

"use client";

import { useState } from "react";
import { useDashboardData } from "./dashboard-data-context";
import type { FileTreeNode, Order } from "./types";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  photoDriveUrl: string | null;
  link: string;
  pricePerPiece: number;
  quantity: number;
  owner: string;
  location: string;
  createdAt: string;
  approvedBy: string;
  state: "Functional" | "Broken" | "Discarded";
}

const formatCurrency = (value: number) =>
  `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

function safeDriveName(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-")
      .slice(0, 200) || "Untitled"
  );
}

function isImageFile(file: Extract<FileTreeNode, { kind: "file" }>) {
  return IMAGE_FILE_PATTERN.test(file.name);
}

function findPhoto(tree: FileTreeNode[], order: Order) {
  const invoices = tree.find(
    (node) => node.kind === "folder" && node.name === "Invoices"
  );
  if (!invoices || invoices.kind !== "folder") return null;

  const orderFolderName = `${safeDriveName(order.title)} ${order.date}`;
  const orderFolder = invoices.children.find(
    (node) => node.kind === "folder" && node.name === orderFolderName
  );
  if (!orderFolder || orderFolder.kind !== "folder") return null;

  const itemFolderName = safeDriveName(
    order.link || order.items[0]?.name || ""
  );
  const itemFolder = orderFolder.children.find(
    (node) => node.kind === "folder" && node.name === itemFolderName
  );
  if (!itemFolder || itemFolder.kind !== "folder") return null;

  const photo = itemFolder.children.find(
    (node) => node.kind === "file" && isImageFile(node)
  );
  if (!photo || photo.kind !== "file") return null;
  return { imageUrl: photo.thumbnailUrl ?? null, driveUrl: photo.url };
}

function toInventoryItem(
  order: Order,
  fileTree: FileTreeNode[]
): InventoryItem {
  const line = order.items[0];
  const photo = findPhoto(fileTree, order);
  return {
    id: order.id,
    name: line?.description?.trim() || order.title,
    description: line?.name ?? "",
    imageUrl: photo?.imageUrl ?? null,
    photoDriveUrl: photo?.driveUrl ?? null,
    link: order.link ?? line?.link ?? "",
    pricePerPiece: line?.price ?? 0,
    quantity: line?.qty ?? 0,
    owner: order.submittedBy ?? "",
    location: order.department,
    createdAt: order.date,
    approvedBy: order.approvedBy ?? "",
    state: order.state ?? "Functional",
  };
}

function PhotoPopup({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#3D3330] bg-[#232120] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#FFEDD1]">
              {item.name}
            </h3>
            <p className="text-[10px] text-[#7A6555]">
              Photo from Google Drive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="text-lg text-[#7A6555] hover:text-[#FFEDD1]"
          >
            ×
          </button>
        </div>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.description || item.name}
            className="max-h-[70vh] w-full rounded-xl bg-[#1A1919] object-contain"
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-[#3D3330] bg-[#1A1919] text-xs text-[#9C8272]">
            The Drive thumbnail is unavailable.
          </div>
        )}
        {item.photoDriveUrl && (
          <a
            href={item.photoDriveUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-xs text-[#F0684D] underline-offset-2 hover:underline"
          >
            Open in Google Drive
          </a>
        )}
      </div>
    </div>
  );
}

function ItemDetail({
  item,
  onBack,
}: {
  item: InventoryItem;
  onBack: () => void;
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  return (
    <div className="flex h-full flex-col overflow-auto">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 self-start text-[11px] text-[#9C8272] hover:text-[#FFEDD1]"
      >
        ← Back to Inventory
      </button>
      {item.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-xl border border-[#3D3330] bg-[#1A1919]">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-52 w-full object-contain"
          />
        </div>
      )}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFEDD1]">{item.name}</h2>
          <p className="mt-0.5 text-[11px] text-[#9C8272]">
            {item.description}
          </p>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 block max-w-[320px] truncate text-[10px] text-[#7A6555] hover:underline"
            >
              {item.link}
            </a>
          )}
        </div>
        {item.imageUrl && (
          <button
            type="button"
            onClick={() => setShowPhoto(true)}
            className="shrink-0 rounded-lg border border-[#F0684D]/40 px-3 py-2 text-[10px] font-medium text-[#F0684D] hover:bg-[#F0684D]/10"
          >
            View photo
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Price / pc", formatCurrency(item.pricePerPiece)],
          ["Quantity", String(item.quantity)],
          ["Total value", formatCurrency(item.pricePerPiece * item.quantity)],
          ["Created", formatDate(item.createdAt)],
          ["Submitted by", item.owner || "—"],
          ["Department", item.location || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#3D3330] bg-[#1A1919] p-3"
          >
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#7A6555]">
              {label}
            </p>
            <p className="text-xs font-semibold text-[#FFEDD1]">{value}</p>
          </div>
        ))}
      </div>
      {showPhoto && (
        <PhotoPopup item={item} onClose={() => setShowPhoto(false)} />
      )}
    </div>
  );
}

export function InventoryPage({ onBack }: { onBack?: () => void }) {
  const { departments, fileTree, orders } = useDashboardData();
  const [query, setQuery] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [department, setDepartment] = useState("All");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [photoItem, setPhotoItem] = useState<InventoryItem | null>(null);
  const [stateById, setStateById] = useState<
    Record<string, InventoryItem["state"]>
  >({});
  const items = orders
    .filter((order) => order.finalized)
    .map((order) => toInventoryItem(order, fileTree));
  const filtered = items.filter((item) => {
    const searchable = [
      item.name,
      item.description,
      item.owner,
      item.approvedBy,
      item.location,
      item.createdAt,
      formatDate(item.createdAt),
      String(item.pricePerPiece),
      formatCurrency(item.pricePerPiece),
      String(item.pricePerPiece * item.quantity),
      formatCurrency(item.pricePerPiece * item.quantity),
      stateById[item.id] ?? item.state,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = [...queries, query.trim()]
      .filter(Boolean)
      .every((term) => searchable.includes(term.toLowerCase()));
    return (
      matchesQuery && (department === "All" || item.location === department)
    );
  });
  const totalValue = items.reduce(
    (sum, item) =>
      (stateById[item.id] ?? item.state) === "Functional"
        ? sum + item.pricePerPiece * item.quantity
        : sum,
    0
  );

  async function updateState(
    item: InventoryItem,
    nextState: InventoryItem["state"]
  ) {
    const previousState = stateById[item.id] ?? item.state;
    setStateById((current) => ({ ...current, [item.id]: nextState }));
    const response = await fetch(`/api/order-requests/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: nextState }),
    });
    if (!response.ok) {
      setStateById((current) => ({ ...current, [item.id]: previousState }));
    }
  }

  if (selected)
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
        <ItemDetail item={selected} onBack={() => setSelected(null)} />
      </div>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] text-[#9C8272] hover:text-[#FFEDD1]"
          >
            ← Back
          </button>
        )}
        <div className="flex-1" />
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#7A6555]">
            Finalized inventory value
          </p>
          <p className="font-mono text-sm font-semibold text-[#FFD142]">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="w-full flex-1 rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-1.5 text-[11px] text-[#FFEDD1] placeholder-[#4A3F38] outline-none focus:border-[#4A3F38]"
          placeholder="Search inventory…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || !query.trim()) return;
            event.preventDefault();
            setQueries((current) => [...current, query.trim()]);
            setQuery("");
          }}
        />
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-8 rounded-lg border border-[#3D3330] bg-[#232120] px-2 text-[11px] text-[#C4A882] outline-none"
        >
          <option value="All">All Departments</option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {queries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {queries.map((term, index) => (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-[#4A3F38] bg-[#2A2724] px-2 py-1 text-[10px] text-[#C4A882]"
              key={`${term}-${index}`}
            >
              {term}
              <button
                type="button"
                aria-label={`Remove search constraint ${term}`}
                className="text-[#9C8272] hover:text-[#FFEDD1]"
                onClick={() =>
                  setQueries((current) => current.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#3D3330] bg-[#232120]">
        <div className="grid grid-cols-[2.5rem_1fr_5rem_3.5rem_5.5rem_6rem_6rem_4rem_5rem] gap-2 border-b border-[#3D3330] px-4 py-2.5 font-mono text-[8px] uppercase tracking-widest text-[#7A6555]">
          <span />
          <span>Item</span>
          <span className="text-right">Price/pc</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Total</span>
          <span>Submitted by</span>
          <span>Department</span>
          <span>Created</span>
          <span />
        </div>
        <div className="divide-y divide-[#3D3330]/50">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[2.5rem_1fr_5rem_3.5rem_5.5rem_6rem_6rem_4rem_5rem] items-center gap-2 px-4 py-3 hover:bg-[#2A2724]"
            >
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="contents text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-[#3D3330] bg-[#1A1919]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-xs font-medium text-[#FFEDD1]">
                    {item.name}
                  </span>
                  <span className="block truncate text-[10px] text-[#7A6555]">
                    {item.description}
                  </span>
                </div>
                <span className="text-right font-mono text-[11px] text-[#C4A882]">
                  {formatCurrency(item.pricePerPiece)}
                </span>
                <span className="text-right font-mono text-[11px] text-[#C4A882]">
                  {item.quantity}
                </span>
                <span className="text-right font-mono text-[11px] font-semibold text-[#FFD142]">
                  {formatCurrency(item.pricePerPiece * item.quantity)}
                </span>
                <span className="truncate text-[10px] text-[#9C8272]">
                  {item.owner || "—"}
                </span>
                <span className="truncate text-[10px] text-[#9C8272]">
                  {item.location}
                </span>
                <span className="text-[10px] text-[#7A6555]">
                  {formatDate(item.createdAt).replace(/\s\d{4}$/, "")}
                </span>
              </button>
              <div className="flex items-center justify-end gap-1">
                <select
                  aria-label={`State for ${item.name}`}
                  className="h-7 rounded-lg border border-[#3D3330] bg-[#1A1919] px-1 text-[9px] text-[#C4A882]"
                  value={stateById[item.id] ?? item.state}
                  onChange={(event) =>
                    updateState(
                      item,
                      event.target.value as InventoryItem["state"]
                    ).catch(() => undefined)
                  }
                >
                  <option value="Functional">State: Functional</option>
                  <option value="Broken">State: Broken</option>
                  <option value="Discarded">State: Discarded</option>
                </select>
                {item.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setPhotoItem(item)}
                    className="rounded-lg border border-[#3D3330] px-2 py-1 text-[10px] text-[#F0684D] hover:bg-[#F0684D]/10"
                  >
                    Photo
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-sm text-[#7A6555]">
              No finalized orders found.
            </div>
          )}
        </div>
      </div>
      {photoItem && (
        <PhotoPopup item={photoItem} onClose={() => setPhotoItem(null)} />
      )}
    </div>
  );
}
