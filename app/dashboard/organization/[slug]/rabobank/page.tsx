import { and, eq } from "drizzle-orm";
import { X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, organization, rabobankConnection } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function RabobankPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(eq(member.userId, user.id), eq(member.organizationId, org.id)),
  });

  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const connections = await db.query.rabobankConnection.findMany({
    where: eq(rabobankConnection.organizationId, org.id),
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl">Rabobank</h1>
          <p className="text-muted-foreground text-sm">
            Connect account insight for this organization and keep transactions
            synced automatically.
          </p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-lg">Connections</h2>
          <div className="mt-3 flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href={`/api/rabobank/connect?organizationId=${org.id}`}>
                Connect account insight
              </Link>
            </Button>
          </div>

          <div className="mt-4 text-sm">
            <p className="font-medium">Existing connections</p>
            {connections.length === 0 ? (
              <p className="text-muted-foreground">No connections yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {connections.map((connection) => (
                  <li
                    className="rounded-md border border-border/70 p-2"
                    key={connection.id}
                  >
                    <p className="font-medium">{connection.product}</p>
                    <p className="text-muted-foreground text-xs">
                      {connection.accountName ??
                        connection.iban ??
                        connection.scope}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-lg">Automatic sync</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Booked transactions are refreshed automatically by the scheduled
            sync job. You can still connect a new account insight consent from
            this page.
          </p>
        </div>
      </div>
    </div>
  );
}
