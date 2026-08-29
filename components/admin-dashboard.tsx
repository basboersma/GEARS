"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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

interface Member {
  id: string;
  role: "member" | "admin" | "owner";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrderItemSummary {
  id: string;
  department: string;
  description: string;
  quantity: number;
  urgency: string;
  typeOfOrder: string;
  totalCosts: number;
  photoAdded: boolean;
  delivered: boolean;
  ordered: boolean;
  finalized: boolean;
  accepted: boolean;
  photoNeeded: boolean;
  photoUploaded: boolean;
  status: string;
  comments: string;
}

interface UpcomingOrderList {
  id: string;
  orderName: string;
  organizationId: string;
  organizationName: string;
  date: Date;
  items: OrderItemSummary[];
}

interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  members: Member[];
  agendaItems: Array<{ id: string; title: string; start: string }>;
  orderedTotal: number;
  pendingTotal: number;
  upcomingOrders: UpcomingOrderList[];
  allocatedBudget: number;
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

function OrganizationSidebar({
  collapsed,
  organizations,
  selectedOrg,
  onToggleCollapse,
  onSelect,
}: {
  collapsed: boolean;
  organizations: OrganizationSummary[];
  selectedOrg: OrganizationSummary | null;
  onToggleCollapse: () => void;
  onSelect: (organization: OrganizationSummary) => void;
}) {
  return (
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
          onClick={onToggleCollapse}
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
            onClick={() => onSelect(organization)}
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
                collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
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
  );
}

export function AdminDashboard({
  organizations,
  totalBudget,
}: {
  organizations: OrganizationSummary[];
  totalBudget: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    organizations[0]?.id ?? null
  );

  const activeOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === activeOrganizationId
      ) ??
      organizations[0] ??
      null,
    [activeOrganizationId, organizations]
  );

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
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/orders">Upcoming orders</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
          Total budget
        </p>
        <p className="mt-1 font-semibold text-2xl">
          {formatCurrency(totalBudget)}
        </p>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You are not an admin for any organization.
        </div>
      ) : (
        <div className="flex min-h-[75vh] w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
          <OrganizationSidebar
            collapsed={collapsed}
            onSelect={(organization) =>
              setActiveOrganizationId(organization.id)
            }
            onToggleCollapse={() => setCollapsed((value) => !value)}
            organizations={organizations}
            selectedOrg={selectedOrg}
          />

          <main className="flex flex-1 bg-muted/10" />
        </div>
      )}
    </div>
  );
}
