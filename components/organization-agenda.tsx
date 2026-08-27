"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = [
  { value: "meeting", label: "Meeting" },
  { value: "review", label: "Review" },
  { value: "task", label: "Task" },
  { value: "deadline", label: "Deadline" },
  { value: "break", label: "Break" },
  { value: "personal", label: "Personal" },
] as const;

interface AgendaEvent {
  id: string;
  start: string;
  end: string;
  title: string;
  category: (typeof categories)[number]["value"];
  description: string;
  location: string | null;
  attendees: string | null;
  isMeeting: boolean;
  minutes: string | null;
}

export function OrganizationAgenda({
  organizationId,
}: {
  organizationId: string;
}) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    start: "09:00",
    end: "10:00",
    title: "",
    category: "meeting" as AgendaEvent["category"],
    description: "",
    location: "",
    attendees: "",
    isMeeting: true,
  });

  const titleMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.value, c.label])),
    []
  );

  const loadAgenda = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/agenda-events?organizationId=${encodeURIComponent(organizationId)}`
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to load agenda");
      }

      const data = (await response.json()) as { events: AgendaEvent[] };
      setEvents(data.events);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadAgenda().catch((error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    });
  }, [loadAgenda]);

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.title.trim() === "" || form.description.trim() === "") {
      toast.error("Title and description are required");
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
          ...form,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to create agenda event");
      }

      setForm({
        start: "09:00",
        end: "10:00",
        title: "",
        category: "meeting",
        description: "",
        location: "",
        attendees: "",
        isMeeting: true,
      });
      toast.success("Agenda event added");
      await loadAgenda();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveMinutes(eventId: string, minutes: string) {
    try {
      const response = await fetch(`/api/agenda-events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to save minutes");
      }

      toast.success("Minutes saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  }

  async function removeEvent(eventId: string) {
    try {
      const response = await fetch(`/api/agenda-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to delete agenda event");
      }

      toast.success("Agenda event removed");
      await loadAgenda();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  }

  const handleMinutesBlur = (eventId: string, minutes: string) => {
    saveMinutes(eventId, minutes).catch((error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    });
  };

  let agendaContent: ReactNode;

  if (isLoading) {
    agendaContent = (
      <p className="text-muted-foreground text-sm">Loading agenda...</p>
    );
  } else if (events.length === 0) {
    agendaContent = (
      <p className="text-muted-foreground text-sm">No agenda items yet.</p>
    );
  } else {
    agendaContent = (
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <article
            className="rounded-lg border border-border bg-muted/30 p-3"
            key={event.id}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-muted-foreground text-xs">
                  {event.start}
                  {event.end !== event.start ? ` - ${event.end}` : ""}
                  {` · ${titleMap[event.category] ?? event.category}`}
                </p>
              </div>

              <Button
                onClick={() => removeEvent(event.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <p className="mb-2 text-muted-foreground text-sm">
              {event.description}
            </p>

            <textarea
              className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={event.minutes ?? ""}
              onBlur={(blurEvent) => {
                handleMinutesBlur(event.id, blurEvent.currentTarget.value);
              }}
              placeholder="Meeting minutes"
            />
          </article>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Agenda</h2>
      </header>

      <form className="mb-6 grid gap-3" onSubmit={createEvent}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Agenda title"
            value={form.title}
          />
          <select
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as AgendaEvent["category"],
              }))
            }
            value={form.category}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, start: event.target.value }))
            }
            placeholder="Start time (e.g. 09:30)"
            value={form.start}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, end: event.target.value }))
            }
            placeholder="End time (e.g. 10:15)"
            value={form.end}
          />
        </div>

        <Input
          onChange={(event) =>
            setForm((current) => ({ ...current, location: event.target.value }))
          }
          placeholder="Location (optional)"
          value={form.location}
        />

        <Input
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              attendees: event.target.value,
            }))
          }
          placeholder="Attendees (comma separated, optional)"
          value={form.attendees}
        />

        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Description"
          value={form.description}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            checked={form.isMeeting}
            className="size-4"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isMeeting: event.target.checked,
              }))
            }
            type="checkbox"
          />
          Is meeting item
        </label>

        <Button className="w-fit" disabled={isSaving} type="submit">
          Add agenda item
        </Button>
      </form>

      {agendaContent}
    </section>
  );
}
