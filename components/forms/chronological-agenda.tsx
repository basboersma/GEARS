"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AgendaItem {
  id: string;
  date: string;
  kind: "order" | "meeting" | "minutes";
  title: string;
  details?: string;
  color: string;
  label: string;
}

export function ChronologicalAgenda({
  organizationId,
  initialItems,
}: {
  organizationId: string;
  initialItems: AgendaItem[];
}) {
  const [items, setItems] = useState<AgendaItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [eventType, setEventType] = useState<"meeting" | "minutes">("meeting");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isSaving, setIsSaving] = useState(false);

  const groupedItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.reduce<Record<string, AgendaItem[]>>((acc, item) => {
      const dateKey = new Date(item.date).toISOString().slice(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [items]);

  const orderedDates = Object.keys(groupedItems).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  async function addAgendaItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/agenda-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          eventType,
          title,
          details,
          eventDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to add agenda item");
      }

      const payload = (await response.json()) as {
        event: {
          id: string;
          eventType: "meeting" | "minutes";
          title: string;
          details?: string | null;
          eventDate: string;
        };
      };

      setItems((current) => [
        ...current,
        {
          id: payload.event.id,
          date: payload.event.eventDate,
          kind: payload.event.eventType,
          title: payload.event.title,
          details: payload.event.details || "",
          color: "#FFFFFF",
          label: payload.event.eventType === "meeting" ? "Meeting" : "Minutes",
        },
      ]);

      setTitle("");
      setDetails("");
      toast.success("Agenda item added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold text-xl">Chronological Agenda</h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Orders, meetings, and minutes organized by date.
      </p>

      <form
        className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5"
        onSubmit={addAgendaItem}
      >
        <Input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Agenda title"
          value={title}
        />
        <Input
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Details (optional)"
          value={details}
        />
        <input
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          onChange={(event) => setEventDate(event.target.value)}
          type="date"
          value={eventDate}
        />
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          onChange={(event) =>
            setEventType(event.target.value as "meeting" | "minutes")
          }
          value={eventType}
        >
          <option value="meeting">Meeting</option>
          <option value="minutes">Minutes</option>
        </select>
        <Button disabled={isSaving} type="submit" variant="outline">
          Add to agenda
        </Button>
      </form>

      <div className="mt-6 space-y-5">
        {orderedDates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No agenda items yet.</p>
        ) : (
          orderedDates.map((dateKey) => (
            <div className="rounded-lg border border-border p-4" key={dateKey}>
              <h3 className="font-medium text-sm uppercase tracking-wide">
                {new Date(dateKey).toLocaleDateString()}
              </h3>

              <div className="mt-3 space-y-2">
                {groupedItems[dateKey].map((item) => (
                  <div
                    className="rounded-md px-3 py-2"
                    key={item.id}
                    style={{
                      backgroundColor: item.color,
                      color: "#1A1919",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-sm">{item.title}</p>
                      <span className="rounded bg-black/10 px-2 py-0.5 text-xs">
                        {item.label}
                      </span>
                    </div>
                    {item.details ? (
                      <p className="mt-1 text-xs opacity-80">{item.details}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
