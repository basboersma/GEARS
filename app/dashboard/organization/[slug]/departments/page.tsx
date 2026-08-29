"use client";

import { Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Department {
  id: string;
  name: string;
}

export default function OrganizationDepartmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const load = async () => {
      const { slug: nextSlug } = await params;
      setSlug(nextSlug);

      const response = await fetch(
        `/api/organization-departments?slug=${nextSlug}`
      );
      const data = (await response.json()) as { departments?: Department[] };
      setDepartments(data.departments ?? []);
      setLoading(false);
    };

    load();
  }, [params]);

  const refreshDepartments = async () => {
    const response = await fetch(`/api/organization-departments?slug=${slug}`);
    const data = (await response.json()) as { departments?: Department[] };
    setDepartments(data.departments ?? []);
  };

  const handleCreate = async () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      toast.error("Department name is required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        `/api/organization-departments?slug=${slug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error || "Unable to add department.");
        return;
      }

      setDraft("");
      await refreshDepartments();
      toast.success("Department added.");
    });
  };

  const handleDelete = async (departmentId: string) => {
    startTransition(async () => {
      const response = await fetch(
        `/api/organization-departments?slug=${slug}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ departmentId }),
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error || "Unable to delete department.");
        return;
      }

      await refreshDepartments();
      toast.success("Department removed.");
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Organization settings</p>
          <h1 className="font-bold text-2xl">Departments</h1>
        </div>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add department name"
            value={draft}
          />
          <Button
            disabled={isPending || !draft.trim()}
            onClick={handleCreate}
            type="button"
          >
            <Plus className="mr-2 size-4" />
            Add department
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-lg">Configured departments</h2>
          <span className="text-muted-foreground text-sm">
            {departments.length} total
          </span>
        </div>

        {loading && (
          <p className="text-muted-foreground text-sm">Loading departments…</p>
        )}

        {!loading && departments.length === 0 && (
          <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
            No departments configured yet.
          </p>
        )}

        {!loading && departments.length > 0 && (
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
                key={department.id}
              >
                <span className="font-medium">{department.name}</span>
                <Button
                  onClick={() => handleDelete(department.id)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
