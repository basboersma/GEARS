"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type CalendarView = "day" | "week" | "month";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const monthTitleFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const dayTitleFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const timeOnlyRegex = /^(\d{1,2}):(\d{2})$/;

function getTodayIsoDate() {
  const now = new Date();
  const timezoneOffsetInMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetInMs)
    .toISOString()
    .slice(0, 10);
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(value: Date, amount: number) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function getWeekStart(value: Date) {
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(value, mondayOffset));
}

function parseTimeOnly(value: string) {
  const match = timeOnlyRegex.exec(value.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function parseEventDate(value: string) {
  const fromDate = new Date(value);

  if (!Number.isNaN(fromDate.getTime())) {
    return fromDate;
  }

  const onlyTime = parseTimeOnly(value);

  if (!onlyTime) {
    return null;
  }

  const today = startOfDay(new Date());
  today.setHours(onlyTime.hours, onlyTime.minutes, 0, 0);
  return today;
}

function eventIntersectsRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
) {
  return start < rangeEnd && end > rangeStart;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampEndAfterStart(startDateTime: Date, endDateTime: Date) {
  if (endDateTime <= startDateTime) {
    const next = new Date(startDateTime);
    next.setMinutes(next.getMinutes() + 30);
    return next;
  }

  return endDateTime;
}

export function OrganizationAgenda({
  organizationId,
}: {
  organizationId: string;
}) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<CalendarView>("day");
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const lastWheelMoveAt = useRef(0);
  const [form, setForm] = useState({
    date: getTodayIsoDate(),
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

    const startDateTime = new Date(`${form.date}T${form.start}`);
    const endDateTimeInput = new Date(`${form.date}T${form.end}`);

    if (
      Number.isNaN(startDateTime.getTime()) ||
      Number.isNaN(endDateTimeInput.getTime())
    ) {
      toast.error("Provide a valid date and time");
      setIsSaving(false);
      return;
    }

    const endDateTime = clampEndAfterStart(startDateTime, endDateTimeInput);

    try {
      const response = await fetch("/api/agenda-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          title: form.title,
          category: form.category,
          description: form.description,
          location: form.location,
          attendees: form.attendees,
          isMeeting: form.isMeeting,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to create agenda event");
      }

      setForm({
        date: getTodayIsoDate(),
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

  const parsedEvents = useMemo(() => {
    return events
      .map((event) => {
        const startDateTime = parseEventDate(event.start);
        const endDateTimeRaw = parseEventDate(event.end);

        if (!startDateTime) {
          return null;
        }

        const fallbackEnd = new Date(startDateTime);
        fallbackEnd.setMinutes(fallbackEnd.getMinutes() + 30);

        const endDateTime = endDateTimeRaw
          ? clampEndAfterStart(startDateTime, endDateTimeRaw)
          : fallbackEnd;

        return {
          ...event,
          startDateTime,
          endDateTime,
        };
      })
      .filter(
        (
          event
        ): event is AgendaEvent & { startDateTime: Date; endDateTime: Date } =>
          Boolean(event)
      )
      .sort(
        (a, b) =>
          a.startDateTime.getTime() - b.startDateTime.getTime() ||
          a.title.localeCompare(b.title)
      );
  }, [events]);

  const calendarRange = useMemo(() => {
    if (view === "day") {
      const start = startOfDay(focusDate);
      return { start, end: addDays(start, 1) };
    }

    if (view === "week") {
      const start = getWeekStart(focusDate);
      return { start, end: addDays(start, 7) };
    }

    const monthStart = new Date(
      focusDate.getFullYear(),
      focusDate.getMonth(),
      1
    );
    const gridStart = getWeekStart(monthStart);
    return { start: gridStart, end: addDays(gridStart, 42) };
  }, [focusDate, view]);

  const visibleEvents = useMemo(
    () =>
      parsedEvents.filter((event) =>
        eventIntersectsRange(
          event.startDateTime,
          event.endDateTime,
          calendarRange.start,
          calendarRange.end
        )
      ),
    [calendarRange.end, calendarRange.start, parsedEvents]
  );

  const weekDays = useMemo(() => {
    const firstDay = getWeekStart(focusDate);
    return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));
  }, [focusDate]);

  const monthCells = useMemo(() => {
    const monthStart = new Date(
      focusDate.getFullYear(),
      focusDate.getMonth(),
      1
    );
    const firstCell = getWeekStart(monthStart);
    return Array.from({ length: 42 }, (_, index) => addDays(firstCell, index));
  }, [focusDate]);

  const periodTitle = useMemo(() => {
    if (view === "day") {
      return dayTitleFormatter.format(focusDate);
    }

    if (view === "week") {
      const weekStart = getWeekStart(focusDate);
      const weekEnd = addDays(weekStart, 6);

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${monthTitleFormatter.format(weekStart)} · ${weekStart.getDate()}-${weekEnd.getDate()}`;
      }

      return `${dayLabelFormatter.format(weekStart)} - ${dayLabelFormatter.format(weekEnd)}`;
    }

    return monthTitleFormatter.format(focusDate);
  }, [focusDate, view]);

  const goToPrevious = () => {
    if (view === "day") {
      setFocusDate((current) => addDays(current, -1));
      return;
    }

    if (view === "week") {
      setFocusDate((current) => addDays(current, -7));
      return;
    }

    setFocusDate((current) => addMonths(current, -1));
  };

  const goToNext = () => {
    if (view === "day") {
      setFocusDate((current) => addDays(current, 1));
      return;
    }

    if (view === "week") {
      setFocusDate((current) => addDays(current, 7));
      return;
    }

    setFocusDate((current) => addMonths(current, 1));
  };

  const goToToday = () => {
    setFocusDate(startOfDay(new Date()));
  };

  const handleCalendarWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 20) {
      return;
    }

    const now = Date.now();

    if (now - lastWheelMoveAt.current < 220) {
      return;
    }

    lastWheelMoveAt.current = now;

    if (event.deltaY > 0) {
      goToNext();
      return;
    }

    goToPrevious();
  };

  const dayEvents = useMemo(
    () =>
      visibleEvents.filter((event) => sameDay(event.startDateTime, focusDate)),
    [focusDate, visibleEvents]
  );

  const weekEventsByDay = useMemo(() => {
    return weekDays.map((day) => ({
      day,
      events: visibleEvents.filter((event) =>
        sameDay(event.startDateTime, day)
      ),
    }));
  }, [visibleEvents, weekDays]);

  const monthEventsByDay = useMemo(() => {
    return monthCells.map((day) => ({
      day,
      events: visibleEvents.filter((event) =>
        sameDay(event.startDateTime, day)
      ),
      inCurrentMonth: day.getMonth() === focusDate.getMonth(),
    }));
  }, [focusDate, monthCells, visibleEvents]);

  const selectedRangeEvents = useMemo(
    () =>
      [...visibleEvents].sort(
        (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
      ),
    [visibleEvents]
  );

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
    const renderEventChip = (
      event: AgendaEvent & { startDateTime: Date; endDateTime: Date }
    ) => (
      <button
        className="w-full rounded-md border border-border/80 bg-background/80 px-2 py-1 text-left transition-colors hover:bg-accent"
        key={event.id}
        onClick={() => setFocusDate(startOfDay(event.startDateTime))}
        type="button"
      >
        <p className="truncate font-medium text-xs">{event.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {timeFormatter.format(event.startDateTime)}
        </p>
      </button>
    );

    let calendarBody: ReactNode;

    if (view === "day") {
      calendarBody = (
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
          <p className="mb-3 font-medium text-sm">
            {dayTitleFormatter.format(focusDate)}
          </p>

          {dayEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dayEvents.map((event) => renderEventChip(event))}
            </div>
          )}
        </div>
      );
    } else if (view === "week") {
      calendarBody = (
        <div className="overflow-x-auto">
          <div className="grid min-w-[48rem] grid-cols-7 gap-2">
            {weekEventsByDay.map(({ day, events: dayItems }) => (
              <div
                className="rounded-lg border border-border/70 bg-muted/20 p-2"
                key={day.toISOString()}
              >
                <p className="mb-2 text-center font-medium text-xs">
                  {weekdayFormatter.format(day)} {day.getDate()}
                </p>

                <div className="flex min-h-40 flex-col gap-1.5">
                  {dayItems.length === 0 ? (
                    <span className="text-center text-muted-foreground text-xs">
                      No events
                    </span>
                  ) : (
                    dayItems.map((event) => renderEventChip(event))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const monthHeaderStart = getWeekStart(focusDate);

      calendarBody = (
        <div className="overflow-x-auto">
          <div className="grid min-w-[56rem] grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, index) => {
              const day = addDays(monthHeaderStart, index);
              return (
                <p
                  className="px-2 pb-1 text-center font-medium text-muted-foreground text-xs"
                  key={day.toISOString()}
                >
                  {weekdayFormatter.format(day)}
                </p>
              );
            })}

            {monthEventsByDay.map(
              ({ day, events: dayItems, inCurrentMonth }) => (
                <div
                  className={`min-h-24 rounded-lg border p-2 ${
                    inCurrentMonth
                      ? "border-border/70 bg-background"
                      : "border-border/40 bg-muted/20"
                  }`}
                  key={day.toISOString()}
                >
                  <button
                    className={`mb-1 rounded px-1 text-xs ${
                      sameDay(day, focusDate)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => {
                      setFocusDate(startOfDay(day));
                      setView("day");
                    }}
                    type="button"
                  >
                    {day.getDate()}
                  </button>

                  <div className="flex flex-col gap-1">
                    {dayItems
                      .slice(0, 3)
                      .map((event) => renderEventChip(event))}
                    {dayItems.length > 3 ? (
                      <p className="text-muted-foreground text-xs">
                        +{dayItems.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      );
    }

    agendaContent = (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-lg border border-border/70 p-3"
          onWheel={handleCalendarWheel}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPrevious}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                onClick={goToNext}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button onClick={goToToday} type="button" variant="outline">
                Today
              </Button>
              <p className="ml-1 font-medium text-sm">{periodTitle}</p>
            </div>

            <div className="inline-flex rounded-lg border border-border p-1">
              {(["day", "week", "month"] as const).map((item) => (
                <button
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    view === item
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={item}
                  onClick={() => setView(item)}
                  type="button"
                >
                  {item[0].toUpperCase()}
                  {item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {calendarBody}
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Events in current {view}</p>

          {selectedRangeEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No events in this range.
            </p>
          ) : (
            selectedRangeEvents.map((event) => (
              <article
                className="rounded-lg border border-border bg-muted/30 p-3"
                key={event.id}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {dayLabelFormatter.format(event.startDateTime)}
                      {` · ${timeFormatter.format(event.startDateTime)}`}
                      {` - ${timeFormatter.format(event.endDateTime)}`}
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
            ))
          )}
        </div>
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Agenda title"
            value={form.title}
          />

          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
            type="date"
            value={form.date}
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
            type="time"
            value={form.start}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, end: event.target.value }))
            }
            type="time"
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
