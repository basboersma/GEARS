"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  const handleRemoveOrganization = (organizationId: string) => {
    startTransition(async () => {
      const result = await deleteOrganization(organizationId);

      if (!result.success) {
        toast.error(result.error || "Failed to remove organization.");
        return;
      }

      toast.success("Organization removed.");
      router.refresh();
    });
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Administration</p>
          <h1 className="font-bold text-3xl">Admin Dashboard</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You are not an admin for any organization.
        </div>
      ) : null}

      {organizations.map((organization) => {
        const totalCash = organization.orderedTotal + organization.pendingTotal;

        return (
          <div
            className="rounded-2xl border bg-card p-6 shadow-sm"
            key={organization.id}
          >
            <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-2xl">{organization.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {organization.members.length} members •{" "}
                  {organization.agendaItems.length} agenda items
                </p>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/dashboard/organization/${organization.slug}`}>
                    Open organization
                  </Link>
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => handleRemoveOrganization(organization.id)}
                  variant="destructive"
                >
                  Remove organisation
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-lg">Members</h3>
                  <div className="space-y-2">
                    {organization.members.map((member) => (
                      <div
                        className="flex items-center justify-between rounded-lg border p-3"
                        key={member.id}
                      >
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {member.user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">
                            {member.role}
                          </span>
                          {member.role !== "owner" ? (
                            <Button
                              disabled={isPending}
                              onClick={() => handleRemoveMember(member.id)}
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

                <div>
                  <h3 className="mb-2 font-semibold text-lg">Agenda</h3>
                  <div className="space-y-2">
                    {organization.agendaItems.length > 0 ? (
                      organization.agendaItems.map((agendaItem) => (
                        <div
                          className="rounded-lg border p-3 text-sm"
                          key={agendaItem.id}
                        >
                          <p className="font-medium">{agendaItem.title}</p>
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
                <h3 className="mb-3 font-semibold text-lg">Order value</h3>
                <PieChart
                  orderedTotal={organization.orderedTotal}
                  pendingTotal={organization.pendingTotal}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold">
                      {formatCurrency(totalCash)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Ordered</span>
                    <span>{formatCurrency(organization.orderedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-500">
                    <span>Pending</span>
                    <span>{formatCurrency(organization.pendingTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
