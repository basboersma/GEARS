"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CalendarView = "day" | "week" | "month";
type AgendaItemType = "meeting" | "event" | "general_members_assembly";
type VoteValue = "for" | "against" | "abstain";

interface DiscussionPoint {
  id: string;
  eventId: string;
  position: number;
  topic: string;
  notes: string | null;
  votePrompt: string | null;
  votingEnabled: boolean;
  votes: {
    for: number;
    against: number;
    abstain: number;
    currentUserVote: VoteValue | null;
  };
}

interface AgendaEvent {
  id: string;
  createdByUserId: string;
  start: string;
  end: string;
  title: string;
  itemType: AgendaItemType;
  isDeadline: boolean;
  allowVoting: boolean;
  description: string;
  location: string | null;
  attendees: string | null;
  minutesSummary: string | null;
  minutesDecisions: string | null;
  minutesActions: string | null;
  canEdit: boolean;
  discussionPoints: DiscussionPoint[];
}

interface ParsedAgendaEvent extends AgendaEvent {
  startDateTime: Date;
  endDateTime: Date;
}

type BatchState = "finalized" | "in_progress" | "attention";

interface OrderBatchItem {
  id: string;
  description: string;
  amount: number;
  delivered: boolean;
  ordered: boolean;
  finalized: boolean;
  status: "accepted" | "declined" | "pending";
  photoNeeded: boolean;
  photoUploaded: boolean;
  totalCosts: string;
  typeOfOrder: string;
  urgency: string;
}

interface OrderBatch {
  id: string;
  orderName: string;
  organizationId: string;
  department: string;
  createdByUserId: string;
  orderedDate: string;
  batchState: BatchState;
  color: string;
  items: OrderBatchItem[];
}

interface DiscussionPointDraft {
  clientId: string;
  id?: string;
  topic: string;
  notes: string;
  votingEnabled: boolean;
  votePrompt: string;
}

function createDiscussionPointDraft(): DiscussionPointDraft {
  return {
    clientId: crypto.randomUUID(),
    topic: "",
    notes: "",
    votingEnabled: false,
    votePrompt: "",
  };
}

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

const itemTypeLabel: Record<AgendaItemType, string> = {
  meeting: "Meeting",
  event: "Event",
  general_members_assembly: "General Members Assembly",
};

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

function parseEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventIntersectsRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
) {
  return start < rangeEnd && end > rangeStart;
}

function clampEndAfterStart(startDateTime: Date, endDateTime: Date) {
  if (endDateTime <= startDateTime) {
    const next = new Date(startDateTime);
    next.setMinutes(next.getMinutes() + 30);
    return next;
  }
  return endDateTime;
}

function getEventStyle(event: ParsedAgendaEvent) {
  if (event.isDeadline) {
    return {
      chip: "border-rose-300/80 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
      badge: "bg-rose-500/20 text-rose-200",
      border: "border-l-rose-400",
    };
  }

  if (event.itemType === "meeting") {
    return {
      chip: "border-blue-300/80 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20",
      badge: "bg-blue-500/20 text-blue-200",
      border: "border-l-blue-400",
    };
  }

  if (event.itemType === "general_members_assembly") {
    return {
      chip: "border-violet-300/80 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
      badge: "bg-violet-500/20 text-violet-200",
      border: "border-l-violet-400",
    };
  }

  return {
    chip: "border-emerald-300/80 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-200",
    border: "border-l-emerald-400",
  };
}

function isMinutesItem(event: ParsedAgendaEvent) {
  return (
    event.itemType === "meeting" ||
    event.itemType === "general_members_assembly"
  );
}

function getBatchStyle(batchState: BatchState) {
  if (batchState === "finalized") {
    return {
      block: "bg-[#FFD142] text-[#2c2413]",
      item: "bg-white/55",
      badge: "bg-[#f8c92f] text-[#3b2e14]",
    };
  }

  if (batchState === "attention") {
    return {
      block: "bg-[#F0684D] text-white",
      item: "bg-white/20",
      badge: "bg-[#cf5a42] text-white",
    };
  }

  return {
    block: "bg-[#FFEDD1] text-[#3b2e14]",
    item: "bg-white/60",
    badge: "bg-[#f4d4a4] text-[#4f3819]",
  };
}

function isOrderBatchItemFinalized(item: OrderBatchItem) {
  return (
    item.finalized ||
    (item.ordered &&
      item.delivered &&
      item.status === "accepted" &&
      (!item.photoNeeded || item.photoUploaded))
  );
}

function getOrderBatchItemClass(item: OrderBatchItem) {
  if (isOrderBatchItemFinalized(item)) {
    return "border-[#FFD142]";
  }

  if (item.status === "declined") {
    return "border-[#F0684D]";
  }

  return "border-[#FFEDD1]";
}

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This single component intentionally coordinates calendar navigation, creation flows, and minutes editing.
export function OrganizationAgenda({
  canEnableVoting,
  canManageAgenda,
  organizationId,
}: {
  canEnableVoting: boolean;
  canManageAgenda: boolean;
  organizationId: string;
}) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [orderBatches, setOrderBatches] = useState<OrderBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [view, setView] = useState<CalendarView>("day");
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrderBatchId, setSelectedOrderBatchId] = useState<
    string | null
  >(null);
  const [createItemType, setCreateItemType] =
    useState<AgendaItemType>("meeting");
  const [createForm, setCreateForm] = useState({
    title: "",
    date: getTodayIsoDate(),
    start: "09:00",
    end: "10:00",
    description: "",
    location: "",
    attendees: "",
    isDeadline: false,
    allowVoting: false,
    discussionPoints: [createDiscussionPointDraft()],
  });
  const [eventSummary, setEventSummary] = useState("");
  const [eventDecisions, setEventDecisions] = useState("");
  const [eventActions, setEventActions] = useState("");
  const [eventAllowVoting, setEventAllowVoting] = useState(false);
  const [eventDiscussionPoints, setEventDiscussionPoints] = useState<
    DiscussionPointDraft[]
  >([]);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const lastWheelMoveAt = useRef(0);

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

      const data = (await response.json()) as {
        events: AgendaEvent[];
        orderBatches?: OrderBatch[];
      };
      setEvents(data.events);
      setOrderBatches(data.orderBatches ?? []);
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

  useEffect(() => {
    function handleWindowClick(event: MouseEvent) {
      if (!createMenuRef.current) {
        return;
      }

      const target = event.target;

      if (target instanceof Node && !createMenuRef.current.contains(target)) {
        setCreateMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleWindowClick);
    return () => window.removeEventListener("mousedown", handleWindowClick);
  }, []);

  const parsedEvents = useMemo(() => {
    return events
      .map((event) => {
        const startDateTime = parseEventDate(event.start);
        const endDateTimeRaw = parseEventDate(event.end);

        if (!(startDateTime && endDateTimeRaw)) {
          return null;
        }

        return {
          ...event,
          startDateTime,
          endDateTime: clampEndAfterStart(startDateTime, endDateTimeRaw),
        };
      })
      .filter((event): event is ParsedAgendaEvent => Boolean(event))
      .sort(
        (a, b) =>
          a.startDateTime.getTime() - b.startDateTime.getTime() ||
          a.title.localeCompare(b.title)
      );
  }, [events]);

  const selectedEvent = useMemo(
    () => parsedEvents.find((event) => event.id === selectedEventId) ?? null,
    [parsedEvents, selectedEventId]
  );
  const canEditSelectedEvent = Boolean(selectedEvent?.canEdit);

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    setEventSummary(selectedEvent.minutesSummary ?? "");
    setEventDecisions(selectedEvent.minutesDecisions ?? "");
    setEventActions(selectedEvent.minutesActions ?? "");
    setEventAllowVoting(selectedEvent.allowVoting);
    setEventDiscussionPoints(
      selectedEvent.discussionPoints.length > 0
        ? selectedEvent.discussionPoints.map((point) => ({
            clientId: crypto.randomUUID(),
            id: point.id,
            topic: point.topic,
            notes: point.notes ?? "",
            votingEnabled: point.votingEnabled,
            votePrompt: point.votePrompt ?? "",
          }))
        : [createDiscussionPointDraft()]
    );
  }, [selectedEvent]);

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

  const dayEvents = useMemo(
    () =>
      visibleEvents.filter((event) => sameDay(event.startDateTime, focusDate)),
    [focusDate, visibleEvents]
  );

  const weekEventsByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        events: visibleEvents.filter((event) =>
          sameDay(event.startDateTime, day)
        ),
      })),
    [visibleEvents, weekDays]
  );

  const monthEventsByDay = useMemo(
    () =>
      monthCells.map((day) => ({
        day,
        events: visibleEvents.filter((event) =>
          sameDay(event.startDateTime, day)
        ),
        inCurrentMonth: day.getMonth() === focusDate.getMonth(),
      })),
    [focusDate, monthCells, visibleEvents]
  );

  const selectedOrderBatch = useMemo(
    () =>
      orderBatches.find((batch) => batch.id === selectedOrderBatchId) ?? null,
    [orderBatches, selectedOrderBatchId]
  );

  const visibleOrderBatches = useMemo(() => {
    return orderBatches.filter((batch) => {
      const batchDate = parseEventDate(batch.orderedDate);

      if (!batchDate) {
        return false;
      }

      const batchEnd = addDays(batchDate, 1);
      return eventIntersectsRange(
        batchDate,
        batchEnd,
        calendarRange.start,
        calendarRange.end
      );
    });
  }, [calendarRange.end, calendarRange.start, orderBatches]);

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

  function openCreateDialog(type: AgendaItemType) {
    setCreateItemType(type);
    setCreateForm({
      title: "",
      date: getTodayIsoDate(),
      start: "09:00",
      end: "10:00",
      description: "",
      location: "",
      attendees: "",
      isDeadline: false,
      allowVoting: false,
      discussionPoints: [createDiscussionPointDraft()],
    });
    setCreateMenuOpen(false);
    setCreateDialogOpen(true);
  }

  function updateDraftPoint(
    index: number,
    patch: Partial<DiscussionPointDraft>
  ) {
    setCreateForm((current) => ({
      ...current,
      discussionPoints: current.discussionPoints.map((point, i) =>
        i === index ? { ...point, ...patch } : point
      ),
    }));
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Creation validation has multiple item-type and deadline branches.
  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startDateTime = new Date(`${createForm.date}T${createForm.start}`);
    const endDateTimeInput = new Date(`${createForm.date}T${createForm.end}`);

    if (
      Number.isNaN(startDateTime.getTime()) ||
      Number.isNaN(endDateTimeInput.getTime())
    ) {
      toast.error("Provide a valid date and time");
      return;
    }

    if (!createForm.isDeadline && createForm.title.trim() === "") {
      toast.error("Title is required");
      return;
    }

    if (createForm.description.trim() === "") {
      toast.error("Description is required");
      return;
    }

    const cleanDiscussionPoints = createForm.discussionPoints
      .map((point) => ({
        topic: point.topic.trim(),
        notes: point.notes.trim(),
        votingEnabled: point.votingEnabled,
        votePrompt: point.votePrompt.trim(),
      }))
      .filter((point) => point.topic !== "");

    if (
      (createItemType === "meeting" ||
        createItemType === "general_members_assembly") &&
      !createForm.isDeadline &&
      cleanDiscussionPoints.length === 0
    ) {
      toast.error("Add at least one discussion point");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/agenda-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          itemType: createItemType,
          isDeadline:
            createItemType === "event" ? createForm.isDeadline : false,
          allowVoting:
            createItemType === "meeting" ||
            createItemType === "general_members_assembly"
              ? canEnableVoting && createForm.allowVoting
              : false,
          title:
            createItemType === "event" && createForm.isDeadline
              ? "Deadline"
              : createForm.title,
          description: createForm.description,
          location:
            createItemType === "event" && createForm.isDeadline
              ? ""
              : createForm.location,
          attendees:
            createItemType === "event" && createForm.isDeadline
              ? ""
              : createForm.attendees,
          start: startDateTime.toISOString(),
          end: clampEndAfterStart(
            startDateTime,
            endDateTimeInput
          ).toISOString(),
          discussionPoints:
            createItemType === "meeting" ||
            createItemType === "general_members_assembly"
              ? cleanDiscussionPoints
              : [],
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to create item");
      }

      toast.success("Agenda item created");
      setCreateDialogOpen(false);
      await loadAgenda();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function saveEventDetails() {
    if (!selectedEvent) {
      return;
    }

    const cleanPoints = eventDiscussionPoints
      .map((point) => ({
        id: point.id,
        topic: point.topic.trim(),
        notes: point.notes.trim(),
        votingEnabled: point.votingEnabled,
        votePrompt: point.votePrompt.trim(),
      }))
      .filter((point) => point.topic !== "");

    if (cleanPoints.length === 0) {
      toast.error("Add at least one discussion point");
      return;
    }

    setIsSavingEvent(true);

    try {
      const response = await fetch(`/api/agenda-events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(canEnableVoting ? { allowVoting: eventAllowVoting } : {}),
          minutesSummary: eventSummary,
          minutesDecisions: eventDecisions,
          minutesActions: eventActions,
          discussionPoints: cleanPoints,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to save details");
      }

      toast.success("Meeting details saved");
      setSelectedEventId(null);
      await loadAgenda();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function castVote(eventId: string, pointId: string, value: VoteValue) {
    try {
      const response = await fetch(
        `/api/agenda-events/${eventId}/discussion-points/${pointId}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to submit vote");
      }

      toast.success("Vote submitted");
      await loadAgenda();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  }

  let agendaContent: ReactNode;

  if (isLoading) {
    agendaContent = (
      <p className="text-muted-foreground text-sm">Loading agenda...</p>
    );
  } else if (events.length === 0 && orderBatches.length === 0) {
    agendaContent = (
      <p className="text-muted-foreground text-sm">No agenda items yet.</p>
    );
  } else {
    const renderEventChip = (event: ParsedAgendaEvent) => {
      const style = getEventStyle(event);

      return (
        <div className="group relative" key={event.id}>
          <button
            className={`w-full rounded-md border px-2 py-1 text-left text-xs transition-colors ${style.chip}`}
            onClick={() => {
              if (isMinutesItem(event)) {
                setSelectedEventId(event.id);
                return;
              }

              setFocusDate(startOfDay(event.startDateTime));
            }}
            type="button"
          >
            <p className="truncate font-medium">{event.title}</p>
            <p className="text-[11px] text-current/80">
              {timeFormatter.format(event.startDateTime)}
            </p>
          </button>

          <div className="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg group-focus-within:block group-hover:block">
            <p className="line-clamp-1 font-medium text-xs">{event.title}</p>
            <p className="mt-1 line-clamp-3 text-muted-foreground text-xs">
              {event.description}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {dayLabelFormatter.format(event.startDateTime)} ·{" "}
              {timeFormatter.format(event.startDateTime)} -{" "}
              {timeFormatter.format(event.endDateTime)}
            </p>
          </div>
        </div>
      );
    };

    const renderOrderBatchChip = (batch: OrderBatch) => {
      const style = getBatchStyle(batch.batchState);

      return (
        <div className="group relative" key={batch.id}>
          <button
            className={`w-full rounded-xl border border-black/10 px-2 py-1 text-left text-xs transition-opacity hover:opacity-90 ${style.block}`}
            onClick={() => setSelectedOrderBatchId(batch.id)}
            type="button"
          >
            <p className="truncate font-medium">{batch.orderName}</p>
            <p className="text-[11px] text-current/80">
              {batch.items.length} items · {batch.department}
            </p>
          </button>

          <div className="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg group-focus-within:block group-hover:block">
            <p className="line-clamp-1 font-medium text-xs">
              {batch.orderName}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Dept {batch.department} · {batch.items.length} items
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {dayLabelFormatter.format(new Date(batch.orderedDate))}
            </p>
          </div>
        </div>
      );
    };

    const dayOrderBatches = visibleOrderBatches.filter((batch) => {
      const batchDate = parseEventDate(batch.orderedDate);
      return batchDate ? sameDay(batchDate, focusDate) : false;
    });

    const weekOrderBatchesByDay = weekDays.map((day) => ({
      day,
      batches: visibleOrderBatches.filter((batch) => {
        const batchDate = parseEventDate(batch.orderedDate);
        return batchDate ? sameDay(batchDate, day) : false;
      }),
    }));

    const monthOrderBatchesByDay = monthCells.map((day) => ({
      day,
      batches: visibleOrderBatches.filter((batch) => {
        const batchDate = parseEventDate(batch.orderedDate);
        return batchDate ? sameDay(batchDate, day) : false;
      }),
    }));

    let calendarBody: ReactNode;

    if (view === "day") {
      calendarBody = (
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
          <p className="mb-3 font-medium text-sm">
            {dayTitleFormatter.format(focusDate)}
          </p>

          {dayEvents.length === 0 && dayOrderBatches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dayEvents.map((event) => renderEventChip(event))}
              {dayOrderBatches.map((batch) => renderOrderBatchChip(batch))}
            </div>
          )}
        </div>
      );
    } else if (view === "week") {
      calendarBody = (
        <div className="overflow-x-auto">
          <div className="grid min-w-[48rem] grid-cols-7 gap-2">
            {weekEventsByDay.map(({ day, events: dayItems }, index) => {
              const dayBatches = weekOrderBatchesByDay[index]?.batches ?? [];
              const hasItems = dayItems.length > 0 || dayBatches.length > 0;

              return (
                <div
                  className="rounded-lg border border-border/70 bg-muted/20 p-2"
                  key={day.toISOString()}
                >
                  <p className="mb-2 text-center font-medium text-xs">
                    {weekdayFormatter.format(day)} {day.getDate()}
                  </p>
                  <div className="flex min-h-40 flex-col gap-1.5">
                    {hasItems ? (
                      <>
                        {dayItems.map((event) => renderEventChip(event))}
                        {dayBatches.map((batch) => renderOrderBatchChip(batch))}
                      </>
                    ) : (
                      <span className="text-center text-muted-foreground text-xs">
                        No events
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
              ({ day, events: dayItems, inCurrentMonth }, index) => {
                const dayBatches = monthOrderBatchesByDay[index]?.batches ?? [];
                const visibleBatches = dayBatches.slice(0, 2);
                const hiddenCount =
                  Math.max(dayItems.length - 3, 0) +
                  Math.max(dayBatches.length - 2, 0);

                return (
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
                      {visibleBatches.map((batch) =>
                        renderOrderBatchChip(batch)
                      )}
                      {hiddenCount > 0 ? (
                        <p className="text-muted-foreground text-xs">
                          +{hiddenCount} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              }
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
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Agenda</h2>
        </div>

        <div className="relative" ref={createMenuRef}>
          {canManageAgenda ? (
            <>
              <Button
                onClick={() => setCreateMenuOpen((current) => !current)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>

              {createMenuOpen ? (
                <div className="absolute top-11 right-0 z-40 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
                  <button
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => openCreateDialog("meeting")}
                    type="button"
                  >
                    Meeting
                  </button>
                  <button
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => openCreateDialog("event")}
                    type="button"
                  >
                    Event
                  </button>
                  <button
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => openCreateDialog("general_members_assembly")}
                    type="button"
                  >
                    General Members Assembly
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      {agendaContent}

      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create {itemTypeLabel[createItemType]}</DialogTitle>
            <DialogDescription>
              {createItemType === "event"
                ? "Create a regular event or mark it as deadline."
                : "Add details, discussion points and voting options."}
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={submitCreate}>
            {createItemType === "event" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={createForm.isDeadline}
                  className="size-4"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      isDeadline: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                This event is a deadline
              </label>
            ) : null}

            {createItemType === "event" && createForm.isDeadline ? null : (
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Title"
                value={createForm.title}
              />
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                type="date"
                value={createForm.date}
              />
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
                type="time"
                value={createForm.start}
              />
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
                type="time"
                value={createForm.end}
              />
            </div>

            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              value={createForm.description}
            />

            {createItemType === "event" && createForm.isDeadline ? null : (
              <>
                <Input
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Location"
                  value={createForm.location}
                />
                <Input
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      attendees: event.target.value,
                    }))
                  }
                  placeholder="Attendees (comma separated)"
                  value={createForm.attendees}
                />
              </>
            )}

            {createItemType === "meeting" ||
            createItemType === "general_members_assembly" ? (
              <>
                {canEnableVoting ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      checked={createForm.allowVoting}
                      className="size-4"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          allowVoting: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Allow members to vote
                  </label>
                ) : null}

                <div className="rounded-md border border-border p-3">
                  <p className="mb-2 font-medium text-sm">Discussion points</p>

                  <div className="flex flex-col gap-2">
                    {createForm.discussionPoints.map((point, index) => (
                      <div
                        className="rounded border border-border/70 p-2"
                        key={point.clientId}
                      >
                        <Input
                          onChange={(event) =>
                            updateDraftPoint(index, {
                              topic: event.target.value,
                            })
                          }
                          placeholder="Point topic"
                          value={point.topic}
                        />
                        <textarea
                          className="mt-2 min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          onChange={(event) =>
                            updateDraftPoint(index, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Notes"
                          value={point.notes}
                        />

                        {createForm.allowVoting ? (
                          <>
                            <label className="mt-2 flex items-center gap-2 text-sm">
                              <input
                                checked={point.votingEnabled}
                                className="size-4"
                                onChange={(event) =>
                                  updateDraftPoint(index, {
                                    votingEnabled: event.target.checked,
                                  })
                                }
                                type="checkbox"
                              />
                              Voting on this point
                            </label>

                            {point.votingEnabled ? (
                              <Input
                                onChange={(event) =>
                                  updateDraftPoint(index, {
                                    votePrompt: event.target.value,
                                  })
                                }
                                placeholder="Vote prompt (optional)"
                                value={point.votePrompt}
                              />
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={() =>
                        setCreateForm((current) => ({
                          ...current,
                          discussionPoints: [
                            ...current.discussionPoints,
                            createDiscussionPointDraft(),
                          ],
                        }))
                      }
                      type="button"
                      variant="outline"
                    >
                      Add point
                    </Button>
                    {createForm.discussionPoints.length > 1 ? (
                      <Button
                        onClick={() =>
                          setCreateForm((current) => ({
                            ...current,
                            discussionPoints: current.discussionPoints.slice(
                              0,
                              -1
                            ),
                          }))
                        }
                        type="button"
                        variant="ghost"
                      >
                        Remove last
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            <DialogFooter>
              <Button
                onClick={() => setCreateDialogOpen(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={isCreating} type="submit">
                Create item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEventId(null);
          }
        }}
        open={selectedEvent !== null}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title ?? "Agenda item"}</DialogTitle>
            <DialogDescription>
              {selectedEvent
                ? `${dayLabelFormatter.format(selectedEvent.startDateTime)} · ${timeFormatter.format(selectedEvent.startDateTime)} - ${timeFormatter.format(selectedEvent.endDateTime)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent ? (
            <div className="grid gap-3">
              <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                <p className="font-medium text-sm">Description</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {selectedEvent.description}
                </p>
              </div>

              {canEnableVoting ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={eventAllowVoting}
                    className="size-4"
                    disabled={!canEditSelectedEvent}
                    onChange={(event) =>
                      setEventAllowVoting(event.target.checked)
                    }
                    type="checkbox"
                  />
                  Allow member voting for this item
                </label>
              ) : null}

              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-md border border-border/70 p-2">
                  <p className="mb-1 font-medium text-sm">Minutes summary</p>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!canEditSelectedEvent}
                    onChange={(event) => setEventSummary(event.target.value)}
                    value={eventSummary}
                  />
                </div>
                <div className="rounded-md border border-border/70 p-2">
                  <p className="mb-1 font-medium text-sm">Decisions</p>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!canEditSelectedEvent}
                    onChange={(event) => setEventDecisions(event.target.value)}
                    value={eventDecisions}
                  />
                </div>
                <div className="rounded-md border border-border/70 p-2">
                  <p className="mb-1 font-medium text-sm">Action items</p>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!canEditSelectedEvent}
                    onChange={(event) => setEventActions(event.target.value)}
                    value={eventActions}
                  />
                </div>
              </div>

              <div className="rounded-md border border-border/70 p-3">
                <p className="mb-2 font-medium text-sm">Discussion points</p>

                <div className="flex flex-col gap-2">
                  {eventDiscussionPoints.map((point, index) => {
                    const originalPoint = selectedEvent.discussionPoints.find(
                      (entry) => entry.id === point.id
                    );

                    return (
                      <div
                        className="rounded border border-border/70 p-2"
                        key={point.clientId}
                      >
                        <Input
                          disabled={!canEditSelectedEvent}
                          onChange={(event) =>
                            setEventDiscussionPoints((current) =>
                              current.map((entry, i) =>
                                i === index
                                  ? { ...entry, topic: event.target.value }
                                  : entry
                              )
                            )
                          }
                          placeholder="Point topic"
                          value={point.topic}
                        />

                        <textarea
                          className="mt-2 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          disabled={!canEditSelectedEvent}
                          onChange={(event) =>
                            setEventDiscussionPoints((current) =>
                              current.map((entry, i) =>
                                i === index
                                  ? { ...entry, notes: event.target.value }
                                  : entry
                              )
                            )
                          }
                          placeholder="Notes"
                          value={point.notes}
                        />

                        {eventAllowVoting ? (
                          <>
                            <label className="mt-2 flex items-center gap-2 text-sm">
                              <input
                                checked={point.votingEnabled}
                                className="size-4"
                                disabled={!canEditSelectedEvent}
                                onChange={(event) =>
                                  setEventDiscussionPoints((current) =>
                                    current.map((entry, i) =>
                                      i === index
                                        ? {
                                            ...entry,
                                            votingEnabled: event.target.checked,
                                          }
                                        : entry
                                    )
                                  )
                                }
                                type="checkbox"
                              />
                              Voting on this point
                            </label>

                            {point.votingEnabled ? (
                              <>
                                <Input
                                  disabled={!canEditSelectedEvent}
                                  onChange={(event) =>
                                    setEventDiscussionPoints((current) =>
                                      current.map((entry, i) =>
                                        i === index
                                          ? {
                                              ...entry,
                                              votePrompt: event.target.value,
                                            }
                                          : entry
                                      )
                                    )
                                  }
                                  placeholder="Vote prompt"
                                  value={point.votePrompt}
                                />

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <span className="rounded bg-muted px-2 py-1">
                                    For: {originalPoint?.votes.for ?? 0}
                                  </span>
                                  <span className="rounded bg-muted px-2 py-1">
                                    Against: {originalPoint?.votes.against ?? 0}
                                  </span>
                                  <span className="rounded bg-muted px-2 py-1">
                                    Neutral: {originalPoint?.votes.abstain ?? 0}
                                  </span>

                                  {point.id ? (
                                    <div className="ml-auto flex gap-1">
                                      <Button
                                        onClick={() => {
                                          castVote(
                                            selectedEvent.id,
                                            point.id as string,
                                            "for"
                                          ).catch((error) => {
                                            const message =
                                              error instanceof Error
                                                ? error.message
                                                : "Unknown error";
                                            toast.error(message);
                                          });
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                      >
                                        Vote For
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          castVote(
                                            selectedEvent.id,
                                            point.id as string,
                                            "against"
                                          ).catch((error) => {
                                            const message =
                                              error instanceof Error
                                                ? error.message
                                                : "Unknown error";
                                            toast.error(message);
                                          });
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                      >
                                        Vote Against
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          castVote(
                                            selectedEvent.id,
                                            point.id as string,
                                            "abstain"
                                          ).catch((error) => {
                                            const message =
                                              error instanceof Error
                                                ? error.message
                                                : "Unknown error";
                                            toast.error(message);
                                          });
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                      >
                                        Neutral
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              </>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex gap-2">
                  {canEditSelectedEvent ? (
                    <>
                      <Button
                        onClick={() =>
                          setEventDiscussionPoints((current) => [
                            ...current,
                            createDiscussionPointDraft(),
                          ])
                        }
                        type="button"
                        variant="outline"
                      >
                        Add point
                      </Button>
                      {eventDiscussionPoints.length > 1 ? (
                        <Button
                          onClick={() =>
                            setEventDiscussionPoints((current) =>
                              current.slice(0, -1)
                            )
                          }
                          type="button"
                          variant="ghost"
                        >
                          Remove last
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setSelectedEventId(null)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                {canEditSelectedEvent ? (
                  <Button
                    disabled={isSavingEvent}
                    onClick={() => {
                      saveEventDetails().catch((error) => {
                        const message =
                          error instanceof Error
                            ? error.message
                            : "Unknown error";
                        toast.error(message);
                      });
                    }}
                    type="button"
                  >
                    Save
                  </Button>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderBatchId(null);
          }
        }}
        open={selectedOrderBatch !== null}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrderBatch?.orderName ?? "Order batch"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrderBatch
                ? `Department ${selectedOrderBatch.department} · ${selectedOrderBatch.items.length} items`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderBatch ? (
            <div className="grid gap-3">
              {selectedOrderBatch.items.map((item) => {
                const itemClass = getOrderBatchItemClass(item);

                return (
                  <article
                    className={`rounded-xl border bg-[#1a1919] p-3 text-white ${itemClass}`}
                    key={item.id}
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-sm">{item.description}</p>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                      <p>Qty: {item.amount}</p>
                      <p>Type: {item.typeOfOrder}</p>
                      <p>Urgency: {item.urgency}</p>
                      <p>Total: {item.totalCosts}</p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded bg-white/15 px-2 py-1">
                        Ordered: {yesNo(item.ordered)}
                      </span>
                      <span className="rounded bg-white/15 px-2 py-1">
                        Delivered: {yesNo(item.delivered)}
                      </span>
                      <span className="rounded bg-white/15 px-2 py-1">
                        Finalized: {yesNo(item.finalized)}
                      </span>
                      <span className="rounded bg-white/15 px-2 py-1">
                        Photo needed: {yesNo(item.photoNeeded)}
                      </span>
                      <span className="rounded bg-white/15 px-2 py-1">
                        Photo uploaded: {yesNo(item.photoUploaded)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
