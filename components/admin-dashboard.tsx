"use client";

import { ResponsiveIcicle } from "@nivo/icicle";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { saveOrganizationBudget } from "@/server/budgets";
import { removeMember } from "@/server/members";
import { deleteOrganization } from "@/server/organizations";

interface Member {
  id: string;
  role: "member" | "sub_owner" | "admin" | "owner";
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
  orderedTotal: number;
  pendingTotal: number;
  upcomingOrders: UpcomingOrderList[];
  allocatedBudget: number;
}

interface BudgetHierarchyNode {
  name: string;
  value?: number;
  color?: string;
  children?: BudgetHierarchyNode[];
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
          Ordered share: {Math.round(orderedShare)}% · Pending share:{" "}
          {Math.round(pendingShare)}%
        </div>
      </div>
    </div>
  );
}

function OrganizationSidebar({
  organizations,
  selectedOrg,
  onSelect,
}: {
  organizations: OrganizationSummary[];
  selectedOrg: OrganizationSummary | null;
  onSelect: (organization: OrganizationSummary) => void;
}) {
  return (
    <aside className="w-72 border-r bg-muted/20 transition-all duration-300">
      <div className="flex items-center border-b p-3">
        <span className="font-medium text-xs uppercase tracking-[0.2em]">
          Teams
        </span>
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

            <div className="max-w-[180px] overflow-hidden">
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

function OrgDetailSidebar({
  selectedOrg,
  onClose,
  onRemove,
  onBudgetChange,
}: {
  selectedOrg: OrganizationSummary;
  onClose: () => void;
  onRemove: (organization: OrganizationSummary) => void;
  onBudgetChange: (organizationId: string, amount: number) => Promise<void>;
}) {
  const [budgetValue, setBudgetValue] = useState(
    String(selectedOrg.allocatedBudget ?? 0)
  );
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setBudgetValue(String(selectedOrg.allocatedBudget ?? 0));
    setExpandedOrderIds((current) => {
      const validCurrent = current.filter((orderId) =>
        selectedOrg.upcomingOrders.some((order) => order.id === orderId)
      );
      return validCurrent.length > 0 ? validCurrent : [];
    });
  }, [selectedOrg]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );
  };

  return (
    <aside className="w-[50%] min-w-0 shrink-0 border-r bg-background p-4">
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
            <p className="font-semibold text-lg">{selectedOrg.name}</p>
            <p className="text-muted-foreground text-xs">
              {selectedOrg.members.length} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild type="button" variant="outline">
            <Link href={`/dashboard/organization/${selectedOrg.slug}`}>
              Visit organisation
            </Link>
          </Button>
          <Button
            className="h-8 w-8 rounded-full p-0"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4 overflow-y-auto">
        <div className="rounded-xl border p-3">
          <h3 className="mb-2 font-semibold text-base">Order value</h3>
          <PieChart
            orderedTotal={selectedOrg.orderedTotal}
            pendingTotal={selectedOrg.pendingTotal}
          />
        </div>

        <div className="rounded-xl border p-3">
          <h3 className="mb-2 font-semibold text-base">Upcoming orders</h3>
          <div className="space-y-2">
            {selectedOrg.upcomingOrders.length > 0 ? (
              selectedOrg.upcomingOrders.map((order) => {
                const isExpanded = expandedOrderIds.includes(order.id);

                return (
                  <div className="rounded-lg border" key={order.id}>
                    <button
                      className="flex w-full items-center justify-between gap-2 p-2 text-left text-sm"
                      onClick={() => toggleOrder(order.id)}
                      type="button"
                    >
                      <div>
                        <p className="font-medium">{order.orderName}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-xs">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </button>

                    {isExpanded ? (
                      <div className="border-t bg-muted/5 p-2">
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div
                              className="rounded-md border bg-background p-2 text-xs"
                              key={item.id}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">
                                  {item.description || item.typeOfOrder}
                                </span>
                                <span className="font-medium text-[11px]">
                                  {formatCurrency(item.totalCosts)}
                                </span>
                              </div>
                              <div className="mt-1 text-muted-foreground">
                                {item.quantity} · {item.department} ·{" "}
                                {item.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
                No upcoming orders.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <h3 className="mb-2 font-semibold text-base">Members</h3>
          <div className="space-y-2">
            {selectedOrg.members.map((member) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm"
                key={member.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.user.name}</p>
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
                      onClick={() => {
                        startSaving(async () => {
                          const result = await removeMember(member.id);
                          if (!result.success) {
                            toast.error(
                              result.error || "Unable to remove member."
                            );
                            return;
                          }
                          toast.success("Member removed.");
                          window.location.reload();
                        });
                      }}
                      size="sm"
                      type="button"
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

        <div className="rounded-xl border p-3">
          <h3 className="mb-2 font-semibold text-base">Budget allocation</h3>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                Organization budget
              </span>
              <input
                className="w-full rounded-md border bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                min="0"
                onChange={(event) => setBudgetValue(event.target.value)}
                step="0.01"
                type="number"
                value={budgetValue}
              />
            </label>
            <Button
              className="w-full"
              disabled={isSaving}
              onClick={() => {
                startSaving(async () => {
                  await onBudgetChange(
                    selectedOrg.id,
                    Number(budgetValue || 0)
                  );
                });
              }}
              type="button"
              variant="outline"
            >
              Save org budget
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={() => onRemove(selectedOrg)}
            type="button"
            variant="destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Remove org
          </Button>
        </div>
      </div>
    </aside>
  );
}

function BudgetTooltip(node: {
  data: BudgetHierarchyNode;
  formattedValue?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-foreground">{node.data.name}</div>
      <div className="text-muted-foreground">
        {node.formattedValue || formatCurrency(Number(node.data.value ?? 0))}
      </div>
    </div>
  );
}

function BudgetBreakdownPanel({ data }: { data: BudgetHierarchyNode }) {
  return (
    <div className="flex h-full min-h-[420px] flex-1 flex-col bg-muted/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Allocation
          </p>
          <h3 className="font-semibold text-lg">Budget structure</h3>
        </div>
      </div>

      <div className="h-[420px] w-full rounded-xl border bg-background/60 p-2">
        <ResponsiveIcicle
          borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          borderRadius={2}
          childColor={{ from: "color", modifiers: [["brighter", 0.15]] }}
          colors={(node) => node.data.color ?? "#8b5cf6"}
          data={data}
          enableLabels
          identity="name"
          label={(node) => node.data.name}
          labelAlign="start"
          labelBaseline="center"
          labelPaddingX={6}
          labelPaddingY={6}
          labelSkipHeight={24}
          labelSkipWidth={28}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.5]] }}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          tooltip={BudgetTooltip}
          valueFormat=">-.0s"
        />
      </div>
    </div>
  );
}

function DeleteOrganizationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  removalKey,
  onKeyChange,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  removalKey: string;
  onKeyChange: (value: string) => void;
  isPending: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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
              onChange={(event) => onKeyChange(event.target.value)}
              placeholder="Enter saved org removal key"
              type="password"
              value={removalKey}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isPending || !removalKey.trim()}
              onClick={onConfirm}
              type="button"
              variant="destructive"
            >
              Confirm removal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminDashboard({
  organizations,
  budgetBreakdown,
}: {
  organizations: OrganizationSummary[];
  budgetBreakdown: BudgetHierarchyNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  const openOrganization = (organization: OrganizationSummary) => {
    if (selectedOrg && selectedOrg.id === organization.id && orgDetailOpen) {
      setOrgDetailOpen(false);
      return;
    }

    setActiveOrganizationId(organization.id);
    setOrgDetailOpen(true);
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

  const handleBudgetChange = async (organizationId: string, amount: number) => {
    const result = await saveOrganizationBudget(organizationId, amount);

    if (!result.success) {
      toast.error(result.error || "Unable to update the organization budget.");
      return;
    }

    toast.success("Organization budget saved.");
    router.refresh();
  };

  const selectedOrg = activeOrganization;

  return (
    <div className="min-h-screen w-full px-3 py-6 sm:px-4 lg:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Administration</p>
          <h1 className="font-bold text-3xl">Admin Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Create Organisation
              </Button>
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
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard/admin/orders">Upcoming orders</Link>
          </Button>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You are not an admin for any organization.
        </div>
      ) : (
        <div className="flex min-h-[75vh] w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
          <OrganizationSidebar
            onSelect={openOrganization}
            organizations={organizations}
            selectedOrg={selectedOrg}
          />

          <div className="flex min-w-0 flex-1">
            {selectedOrg && orgDetailOpen ? (
              <OrgDetailSidebar
                onBudgetChange={handleBudgetChange}
                onClose={() => setOrgDetailOpen(false)}
                onRemove={(organization) => {
                  setPendingDelete(organization);
                  setDeleteOpen(true);
                  setOrgDetailOpen(false);
                }}
                selectedOrg={selectedOrg}
              />
            ) : (
              <div className="flex-1 bg-muted/10" />
            )}
            <BudgetBreakdownPanel data={budgetBreakdown} />
          </div>
        </div>
      )}

      <DeleteOrganizationDialog
        isPending={isPending}
        onCancel={() => {
          setDeleteOpen(false);
          setPendingDelete(null);
          setRemovalKey("");
        }}
        onConfirm={handleDeleteOrganization}
        onKeyChange={setRemovalKey}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setPendingDelete(null);
            setRemovalKey("");
          }
        }}
        open={deleteOpen}
        removalKey={removalKey}
      />
    </div>
  );
}
