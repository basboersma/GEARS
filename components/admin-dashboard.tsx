"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removeMember } from "@/server/members";
import { deleteOrganization } from "@/server/organizations";

interface Member {
  id: string;
  role: "member" | "admin" | "owner";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  members: Member[];
  agendaItems: Array<{ id: string; title: string; start: string }>;
  orderedTotal: number;
  pendingTotal: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function PieChart({
  orderedTotal,
  pendingTotal,
}: {
  orderedTotal: number;
  pendingTotal: number;
}) {
  const total = orderedTotal + pendingTotal;
  const orderedShare = total > 0 ? (orderedTotal / total) * 100 : 0;
  const pendingShare = total > 0 ? 100 - orderedShare : 0;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-24 rounded-full border border-border"
        style={{
          background: `conic-gradient(#22c55e 0 ${orderedShare}%, #fbbf24 ${orderedShare}% 100%)`,
        }}
      >
        <div className="absolute inset-3 rounded-full bg-background" />
        <div className="absolute inset-0 flex items-center justify-center text-center font-semibold text-[10px] leading-tight">
          {total > 0 ? `${Math.round(orderedShare)}%` : "0%"}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
          <span>Ordered: {formatCurrency(orderedTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-amber-400" />
          <span>Pending: {formatCurrency(pendingTotal)}</span>
        </div>
        <div className="text-muted-foreground text-xs">
          Ordered share: {Math.round(orderedShare)}% • Pending share:{" "}
          {Math.round(pendingShare)}%
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({
  organizations,
}: {
  organizations: OrganizationSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    organizations[0]?.id ?? null
  );
  const [orgDetailOpen, setOrgDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removalKey, setRemovalKey] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<OrganizationSummary | null>(null);

  const activeOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === activeOrganizationId
      ) ??
      organizations[0] ??
      null,
    [activeOrganizationId, organizations]
  );

  const handleOpenInfo = (organization: OrganizationSummary) => {
    const isSameOrg = activeOrganizationId === organization.id && orgDetailOpen;

    setActiveOrganizationId(organization.id);
    setOrgDetailOpen(!isSameOrg);
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await removeMember(memberId);

      if (!result.success) {
        toast.error(result.error || "Failed to remove member.");
        return;
      }

      toast.success("Member removed.");
      router.refresh();
    });
  };

  const handleDeleteOrganization = () => {
    if (!pendingDelete) {
      return;
    }

    startTransition(async () => {
      const result = await deleteOrganization(pendingDelete.id, removalKey);

      if (!result.success) {
        toast.error(result.error || "Failed to remove organization.");
        return;
      }

      toast.success("Organization removed.");
      setDeleteOpen(false);
      setPendingDelete(null);
      setRemovalKey("");
      router.refresh();
    });
  };

  const selectedOrg = activeOrganization;

  return (
    <div className="min-h-screen w-full px-3 py-6 sm:px-4 lg:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Administration</p>
          <h1 className="font-bold text-3xl">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Create Organisation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to get started.
                </DialogDescription>
              </DialogHeader>
              <CreateOrganizationForm />
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You are not an admin for any organization.
        </div>
      ) : (
        <div className="flex min-h-[75vh] w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
          <aside
            className={`border-r bg-muted/20 transition-all duration-300 ${
              collapsed ? "w-20" : "w-72"
            }`}
          >
            <div className="flex items-center justify-between border-b p-3">
              <span
                className={`font-medium text-xs uppercase tracking-[0.2em] ${
                  collapsed ? "hidden" : "block"
                }`}
              >
                Teams
              </span>
              <Button
                className="h-8 w-8 rounded-full p-0"
                onClick={() => setCollapsed((value) => !value)}
                type="button"
                variant="outline"
              >
                {collapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-2 p-2">
              {organizations.map((organization) => (
                <button
                  className={`group flex items-center gap-3 rounded-xl border p-2 text-left transition-all hover:border-primary/60 ${
                    selectedOrg?.id === organization.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-transparent"
                  }`}
                  key={organization.id}
                  onClick={() => handleOpenInfo(organization)}
                  type="button"
                >
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl font-bold text-sm text-white shadow-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%)",
                    }}
                    title={organization.name}
                  >
                    {getInitials(organization.name)}
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      collapsed
                        ? "max-w-0 opacity-0"
                        : "max-w-[180px] opacity-100"
                    }`}
                  >
                    <p className="truncate font-medium text-sm group-hover:translate-x-0">
                      {organization.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      org
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1">
            {selectedOrg && orgDetailOpen ? (
              <aside className="w-full max-w-[48%] shrink-0 border-r bg-background p-4">
                <div className="flex items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-12 items-center justify-center rounded-xl font-bold text-sm text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%)",
                      }}
                    >
                      {getInitials(selectedOrg.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedOrg.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {selectedOrg.members.length} members
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setOrgDetailOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border p-3">
                    <h3 className="mb-2 font-semibold text-base">Members</h3>
                    <div className="space-y-2">
                      {selectedOrg.members.map((member) => (
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm"
                          key={member.id}
                        >
                          <span>{member.user.name}</span>
                          <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.15em]">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <h3 className="mb-2 font-semibold text-base">
                      Order value
                    </h3>
                    <PieChart
                      orderedTotal={selectedOrg.orderedTotal}
                      pendingTotal={selectedOrg.pendingTotal}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button asChild className="flex-1" variant="outline">
                      <Link
                        href={`/dashboard/organization/${selectedOrg.slug}`}
                      >
                        Open organization
                      </Link>
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setPendingDelete(selectedOrg);
                        setDeleteOpen(true);
                        setOrgDetailOpen(false);
                      }}
                      variant="destructive"
                    >
                      Remove org
                    </Button>
                  </div>
                </div>
              </aside>
            ) : null}

            <main className="flex flex-1 flex-col gap-4 p-4">
              {selectedOrg ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-14 items-center justify-center rounded-2xl font-bold text-lg text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #3b82f6 100%)",
                        }}
                      >
                        {getInitials(selectedOrg.name)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-2xl">
                          {selectedOrg.name}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {selectedOrg.members.length} members •{" "}
                          {selectedOrg.agendaItems.length} agenda items
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link
                          href={`/dashboard/organization/${selectedOrg.slug}`}
                        >
                          Open organization
                        </Link>
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() => {
                          setPendingDelete(selectedOrg);
                          setDeleteOpen(true);
                        }}
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remove org
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <div className="rounded-xl border p-4">
                        <h3 className="mb-3 font-semibold text-lg">Members</h3>
                        <div className="space-y-2">
                          {selectedOrg.members.map((member) => (
                            <div
                              className="flex items-center justify-between gap-3 rounded-lg border p-3"
                              key={member.id}
                            >
                              <div>
                                <p className="font-medium">
                                  {member.user.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {member.user.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.15em]">
                                  {member.role}
                                </span>
                                {member.role !== "owner" ? (
                                  <Button
                                    disabled={isPending}
                                    onClick={() =>
                                      handleRemoveMember(member.id)
                                    }
                                    size="sm"
                                    variant="destructive"
                                  >
                                    Remove
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border p-4">
                        <h3 className="mb-3 font-semibold text-lg">Agenda</h3>
                        <div className="space-y-2">
                          {selectedOrg.agendaItems.length > 0 ? (
                            selectedOrg.agendaItems.map((agendaItem) => (
                              <div
                                className="rounded-lg border p-3 text-sm"
                                key={agendaItem.id}
                              >
                                <p className="font-medium">
                                  {agendaItem.title}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {new Date(agendaItem.start).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
                              No agenda items yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                      <h3 className="mb-3 font-semibold text-lg">
                        Order value
                      </h3>
                      <PieChart
                        orderedTotal={selectedOrg.orderedTotal}
                        pendingTotal={selectedOrg.pendingTotal}
                      />
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Total</span>
                          <span className="font-semibold">
                            {formatCurrency(
                              selectedOrg.orderedTotal +
                                selectedOrg.pendingTotal
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-600">
                          <span>Ordered</span>
                          <span>
                            {formatCurrency(selectedOrg.orderedTotal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-500">
                          <span>Pending</span>
                          <span>
                            {formatCurrency(selectedOrg.pendingTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </main>
          </div>
        </div>
      )}

      <Dialog
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setPendingDelete(null);
            setRemovalKey("");
          }
        }}
        open={deleteOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove organisation</DialogTitle>
            <DialogDescription>
              Enter the removal key to permanently delete this organisation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="removal-key">
                Removal key
              </label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                id="removal-key"
                onChange={(event) => setRemovalKey(event.target.value)}
                placeholder="Enter saved org removal key"
                type="password"
                value={removalKey}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setDeleteOpen(false);
                  setPendingDelete(null);
                  setRemovalKey("");
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isPending || !removalKey.trim()}
                onClick={handleDeleteOrganization}
                type="button"
                variant="destructive"
              >
                Confirm removal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
