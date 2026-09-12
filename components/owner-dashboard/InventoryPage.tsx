// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported inventory dashboard JSX attribute order.
// biome-ignore-all lint: Preserves the imported inventory dashboard interaction and formatting conventions.
"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  link: string;
  pricePerPiece: number;
  quantity: number;
  owner: string;
  location: string;
  createdAt: string;
  isBroken: boolean;
  isWrittenOff: boolean;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const OWNERS = [
  "Alex van den Berg",
  "Sophie Janssen",
  "Daan Mulder",
  "Emma de Vries",
  "Liam Bakker",
  "Noah Smit",
];
const LOCATIONS = [
  "Lab A",
  "Lab B",
  "Storage Room",
  "Workshop",
  "PR Room",
  "Server Closet",
];

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "inv1",
    name: "3D Printer — Prusa MK4",
    description: "FDM 3D printer for rapid prototyping. Nozzle 0.4 mm.",
    imageUrl: null,
    link: "https://www.prusa3d.com/product/original-prusa-mk4-2/",
    pricePerPiece: 799,
    quantity: 2,
    owner: "Alex van den Berg",
    location: "Lab A",
    createdAt: "2025-02-14",
    isBroken: false,
    isWrittenOff: false,
  },
  {
    id: "inv2",
    name: "Oscilloscope 4-ch 200 MHz",
    description: "Rigol DS1054Z digital oscilloscope with 4 channels.",
    imageUrl: null,
    link: "https://www.rigol.com/",
    pricePerPiece: 349,
    quantity: 1,
    owner: "Daan Mulder",
    location: "Lab B",
    createdAt: "2024-11-03",
    isBroken: true,
    isWrittenOff: false,
  },
  {
    id: "inv3",
    name: "Soldering Station — Hakko FX-888D",
    description: "Temperature-controlled soldering station.",
    imageUrl: null,
    link: "https://www.hakko.com/",
    pricePerPiece: 112,
    quantity: 3,
    owner: "Noah Smit",
    location: "Workshop",
    createdAt: "2025-01-20",
    isBroken: false,
    isWrittenOff: false,
  },
  {
    id: "inv4",
    name: 'MacBook Pro M3 14"',
    description: "Team laptop for software development and demos.",
    imageUrl: null,
    link: "https://www.apple.com/macbook-pro/",
    pricePerPiece: 1999,
    quantity: 1,
    owner: "Liam Bakker",
    location: "PR Room",
    createdAt: "2024-09-01",
    isBroken: false,
    isWrittenOff: false,
  },
  {
    id: "inv5",
    name: "Arduino Mega 2560 (×10 pack)",
    description: "Microcontroller boards for prototyping.",
    imageUrl: null,
    link: "https://store.arduino.cc/",
    pricePerPiece: 42,
    quantity: 10,
    owner: "Alex van den Berg",
    location: "Storage Room",
    createdAt: "2025-03-10",
    isBroken: false,
    isWrittenOff: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `€${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ── QR popup (placeholder) ─────────────────────────────────────────────────────
function ItemQRPopup({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    if ((x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)) return true;
    return (x * 5 + y * 11 + i * 7 + item.id.charCodeAt(3)) % 13 < 6;
  });
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-5 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#FFEDD1]">QR Code</h3>
            <p className="text-[10px] text-[#7A6555] mt-0.5 truncate max-w-[180px]">
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="bg-white rounded-xl p-3 mx-auto w-fit">
          <svg
            width="140"
            height="140"
            viewBox="0 0 21 21"
            shapeRendering="crispEdges"
          >
            {cells.map((on, i) =>
              on ? (
                <rect
                  key={i}
                  x={i % 21}
                  y={Math.floor(i / 21)}
                  width="1"
                  height="1"
                  fill="#1A1919"
                />
              ) : null
            )}
          </svg>
        </div>
        <p className="text-center text-[10px] text-[#7A6555] mt-3">
          Scan to view item record
        </p>
      </div>
    </div>
  );
}

// ── Image upload popup ──────────────────────────────────────────────────────────
function ImageUploadPopup({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (url: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#FFEDD1]">Upload Photo</h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors"
          >
            ✕
          </button>
        </div>
        <div
          className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${drag ? "border-[#F0684D]/60 bg-[#F0684D]/8" : "border-[#3D3330] hover:border-[#4A3F38]"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file";
            inp.accept = "image/*";
            inp.onchange = () => {
              if (inp.files?.[0]) handleFile(inp.files[0]);
            };
            inp.click();
          }}
        >
          {preview ? (
            <img
              src={preview}
              className="h-28 w-full object-contain rounded-lg"
              alt="preview"
            />
          ) : (
            <div>
              <p className="text-3xl text-[#4A3F38] mb-2">📷</p>
              <p className="text-xs text-[#9C8272]">
                Drop image here or click to browse
              </p>
            </div>
          )}
        </div>
        {preview && (
          <button
            onClick={() => {
              onUploaded(preview!);
              onClose();
            }}
            className="mt-3 w-full py-2 rounded-xl text-sm font-medium border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10 transition-colors"
          >
            Use This Photo
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add item modal ─────────────────────────────────────────────────────────────
function AddItemModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: InventoryItem) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [owner, setOwner] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImgUpload, setShowImgUpload] = useState(false);

  function submit() {
    if (!name) return;
    onAdd({
      id: crypto.randomUUID(),
      name,
      description: desc,
      imageUrl,
      link,
      pricePerPiece: parseFloat(price) || 0,
      quantity: parseInt(qty) || 1,
      owner,
      location,
      createdAt: new Date().toISOString().slice(0, 10),
      isBroken: false,
      isWrittenOff: false,
    });
    onClose();
  }

  const fieldCls =
    "h-8 w-full rounded-lg bg-[#1A1919] border border-[#3D3330] px-2.5 text-xs text-[#FFEDD1] placeholder:text-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors";
  const selectCls =
    "h-8 w-full rounded-lg bg-[#1A1919] border border-[#3D3330] px-2 text-xs text-[#C4A882] focus:outline-none focus:border-[#4A3F38] transition-colors cursor-pointer";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#3D3330] sticky top-0 bg-[#232120] z-10">
          <h3 className="text-sm font-semibold text-[#FFEDD1]">
            Add Inventory Item
          </h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3">
          {/* Image */}
          <div
            className="rounded-xl border-2 border-dashed border-[#3D3330] hover:border-[#4A3F38] p-4 text-center cursor-pointer transition-colors"
            onClick={() => setShowImgUpload(true)}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                className="h-20 w-full object-contain rounded-lg"
                alt="item"
              />
            ) : (
              <div>
                <p className="text-2xl text-[#4A3F38]">📷</p>
                <p className="text-[10px] text-[#7A6555] mt-1">
                  Click to add photo
                </p>
              </div>
            )}
          </div>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Item Name *
            </span>
            <input
              className={fieldCls}
              placeholder="e.g. Stepper Motor NEMA 17"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Description
            </span>
            <input
              className={fieldCls}
              placeholder="Short description…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Link / URL
            </span>
            <input
              className={fieldCls}
              placeholder="https://…"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                Price per piece (€)
              </span>
              <input
                className={`${fieldCls} font-mono`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                Quantity
              </span>
              <input
                className={`${fieldCls} font-mono`}
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                Owner
              </span>
              <select
                className={selectCls}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                <option value="">—</option>
                {OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                Location
              </span>
              <select
                className={selectCls}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">—</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {price && qty && (
            <p className="text-[11px] text-[#9C8272]">
              Total value:{" "}
              <span className="text-[#FFD142] font-mono font-semibold">
                {fmt((parseFloat(price) || 0) * (parseInt(qty) || 1))}
              </span>
            </p>
          )}
          <button
            onClick={submit}
            disabled={!name}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[#F0684D]/40 text-[#F0684D] bg-[#F0684D]/8 hover:bg-[#F0684D]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add to Inventory
          </button>
        </div>
      </div>
      {showImgUpload && (
        <ImageUploadPopup
          onClose={() => setShowImgUpload(false)}
          onUploaded={(url) => {
            setImageUrl(url);
            setShowImgUpload(false);
          }}
        />
      )}
    </div>
  );
}

// ── Item detail panel ──────────────────────────────────────────────────────────
function ItemDetail({
  item,
  onBack,
  onUpdate,
}: {
  item: InventoryItem;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<InventoryItem>) => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const [showImgUpload, setShowImgUpload] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-[#9C8272] hover:text-[#FFEDD1] transition-colors mb-5 self-start"
      >
        <svg
          viewBox="0 0 12 12"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M7.5 2L3.5 6l4 4" />
        </svg>
        Back to Inventory
      </button>

      {/* Image */}
      <div
        className="rounded-xl border border-[#3D3330] bg-[#1A1919] overflow-hidden mb-4 cursor-pointer hover:border-[#4A3F38] transition-colors"
        onClick={() => setShowImgUpload(true)}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            className="w-full h-36 object-cover"
            alt={item.name}
          />
        ) : (
          <div className="h-36 flex flex-col items-center justify-center gap-2 text-[#4A3F38]">
            <span className="text-3xl">📷</span>
            <span className="text-[10px]">Click to add photo</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#FFEDD1]">{item.name}</h2>
          <p className="text-[11px] text-[#9C8272] mt-0.5">
            {item.description}
          </p>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[#7A6555] hover:text-[#C4A882] transition-colors underline-offset-2 truncate block mt-0.5 max-w-[220px]"
            >
              {item.link}
            </a>
          )}
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="shrink-0 w-9 h-9 rounded-lg border border-[#3D3330] bg-[#1A1919] flex items-center justify-center hover:border-[#4A3F38] transition-colors text-sm"
        >
          ▦
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          ["Price / pc", fmt(item.pricePerPiece)],
          ["Quantity", String(item.quantity)],
          ["Total Value", fmt(item.pricePerPiece * item.quantity)],
          ["Created", fmtDate(item.createdAt)],
          ["Owner", item.owner || "—"],
          ["Location", item.location || "—"],
        ].map(([l, v]) => (
          <div
            key={l}
            className="bg-[#1A1919] rounded-xl border border-[#3D3330] p-3"
          >
            <p className="text-[9px] font-mono text-[#7A6555] uppercase tracking-wider mb-1">
              {l}
            </p>
            <p className="text-xs text-[#FFEDD1] font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onUpdate(item.id, { isBroken: !item.isBroken })}
          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${item.isBroken ? "border-orange-500/40 text-orange-400 bg-orange-500/10" : "border-[#3D3330] text-[#9C8272] hover:text-orange-400 hover:border-orange-500/40"}`}
        >
          {item.isBroken ? "⚠ Broken" : "Mark Broken"}
        </button>
        <button
          onClick={() =>
            onUpdate(item.id, { isWrittenOff: !item.isWrittenOff })
          }
          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${item.isWrittenOff ? "border-[#f43f5e]/40 text-[#f43f5e] bg-[#f43f5e]/10" : "border-[#3D3330] text-[#9C8272] hover:text-[#f43f5e] hover:border-[#f43f5e]/40"}`}
        >
          {item.isWrittenOff ? "✗ Written Off" : "Write Off"}
        </button>
      </div>

      {showQR && <ItemQRPopup item={item} onClose={() => setShowQR(false)} />}
      {showImgUpload && (
        <ImageUploadPopup
          onClose={() => setShowImgUpload(false)}
          onUploaded={(url) => {
            onUpdate(item.id, { imageUrl: url });
            setShowImgUpload(false);
          }}
        />
      )}
    </div>
  );
}

// ── Inventory page ─────────────────────────────────────────────────────────────
export function InventoryPage({ onBack }: { onBack?: () => void }) {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "broken" | "written-off"
  >("all");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
    if (selected?.id === id)
      setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const filtered = items.filter((it) => {
    const matchQ =
      it.name.toLowerCase().includes(q.toLowerCase()) ||
      it.description.toLowerCase().includes(q.toLowerCase()) ||
      it.owner.toLowerCase().includes(q.toLowerCase()) ||
      it.location.toLowerCase().includes(q.toLowerCase());
    const matchDept =
      deptFilter === "All" ||
      it.location === deptFilter ||
      it.owner.includes(deptFilter);
    const matchF =
      filter === "all"
        ? true
        : filter === "broken"
          ? it.isBroken
          : filter === "written-off"
            ? it.isWrittenOff
            : !it.isBroken && !it.isWrittenOff;
    return matchQ && matchDept && matchF;
  });

  const totalValue = items
    .filter((i) => !i.isWrittenOff)
    .reduce((s, i) => s + i.pricePerPiece * i.quantity, 0);

  if (selected)
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-auto p-4">
        <ItemDetail
          item={selected}
          onBack={() => setSelected(null)}
          onUpdate={updateItem}
        />
      </div>
    );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Header row */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1" />
        <div className="text-right shrink-0">
          <p className="text-[9px] font-mono text-[#7A6555] uppercase tracking-widest">
            Active inventory value
          </p>
          <p className="text-sm font-mono font-semibold text-[#FFD142]">
            {fmt(totalValue)}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#F0684D]/40 text-[#F0684D] bg-[#F0684D]/8 hover:bg-[#F0684D]/15 transition-colors shrink-0"
        >
          + Add Item
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7A6555]"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="5" cy="5" r="3.5" />
            <path d="M8 8l2.5 2.5" />
          </svg>
          <input
            className="pl-7 pr-3 py-1.5 rounded-lg w-full bg-[#232120] border border-[#3D3330] text-[11px] text-[#FFEDD1] placeholder-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors"
            placeholder="Search inventory…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-8 rounded-lg bg-[#232120] border border-[#3D3330] px-2 text-[11px] text-[#C4A882] focus:outline-none focus:border-[#4A3F38] transition-colors cursor-pointer shrink-0"
        >
          <option value="All">All Departments</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {(["all", "active", "broken", "written-off"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors capitalize ${filter === f ? "bg-[#2A2724] text-[#FFEDD1] border-[#4A3F38]" : "text-[#9C8272] border-transparent hover:text-[#FFEDD1] hover:bg-white/5"}`}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 rounded-2xl border border-[#3D3330] bg-[#232120] overflow-auto">
        {/* Column header */}
        <div className="grid grid-cols-[2.5rem_1fr_5rem_3.5rem_5.5rem_5rem_5rem_4rem_2.5rem] gap-2 px-4 py-2.5 border-b border-[#3D3330] sticky top-0 bg-[#232120] z-10 font-mono text-[8px] text-[#7A6555] uppercase tracking-widest">
          <span />
          <span>Item</span>
          <span className="text-right">Price/pc</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Total</span>
          <span>Owner</span>
          <span>Location</span>
          <span>Created</span>
          <span />
        </div>

        <div className="divide-y divide-[#3D3330]/50">
          {filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => setSelected(it)}
              className={`w-full grid grid-cols-[2.5rem_1fr_5rem_3.5rem_5.5rem_5rem_5rem_4rem_2.5rem] gap-2 px-4 py-3 hover:bg-[#2A2724] transition-colors text-left items-center ${it.isWrittenOff ? "opacity-40" : ""}`}
            >
              {/* Image */}
              <div className="w-8 h-8 rounded-lg bg-[#1A1919] border border-[#3D3330] overflow-hidden flex items-center justify-center shrink-0">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    className="w-full h-full object-cover"
                    alt={it.name}
                  />
                ) : (
                  <span className="text-[16px]">📦</span>
                )}
              </div>
              {/* Name + desc */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium text-[#FFEDD1] truncate">
                    {it.name}
                  </span>
                  {it.isBroken && (
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 shrink-0">
                      BROKEN
                    </span>
                  )}
                  {it.isWrittenOff && (
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-[#f43f5e]/20 text-[#f43f5e] shrink-0">
                      W/OFF
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#7A6555] truncate block">
                  {it.description}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#C4A882] text-right">
                {fmt(it.pricePerPiece)}
              </span>
              <span className="text-[11px] font-mono text-[#C4A882] text-right">
                {it.quantity}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#FFD142] text-right">
                {fmt(it.pricePerPiece * it.quantity)}
              </span>
              <span className="text-[10px] text-[#9C8272] truncate">
                {it.owner.split(" ").slice(-1)[0]}
              </span>
              <span className="text-[10px] text-[#9C8272] truncate">
                {it.location}
              </span>
              <span className="text-[10px] text-[#7A6555]">
                {fmtDate(it.createdAt).replace(/\s\d{4}$/, "")}
              </span>
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 text-[#4A3F38]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4.5 2l4 4-4 4" />
              </svg>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-[#4A3F38] gap-2">
              <span className="text-3xl font-thin">—</span>
              <span className="text-sm">No items found</span>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onAdd={(it) => setItems((prev) => [it, ...prev])}
        />
      )}
    </div>
  );
}
