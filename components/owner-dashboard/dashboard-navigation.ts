export type DashboardRole =
  | "admin"
  | "owner"
  | "sublead"
  | "treasurer"
  | "advisor"
  | "member";

export interface DashboardNavigationItem {
  key:
    | "dashboard"
    | "members"
    | "orders"
    | "inventory"
    | "gma"
    | "treasurer"
    | "board";
  label: string;
  href: string;
}

export function getDashboardNavigation({
  organizationSlug,
  role,
  gmaCreated,
}: {
  organizationSlug: string;
  role: DashboardRole;
  gmaCreated: boolean;
}): DashboardNavigationItem[] {
  const dashboardHref = `/dashboard/organization/${organizationSlug}`;
  const navigation: DashboardNavigationItem[] = [
    { key: "dashboard", label: "Dashboard", href: dashboardHref },
    {
      key: "members",
      label: "Manage members",
      href: `${dashboardHref}/members`,
    },
    {
      key: "orders",
      label: "Manage orders",
      href: `${dashboardHref}/order-review`,
    },
    {
      key: "inventory",
      label: "Inventory",
      href: `${dashboardHref}/inventory`,
    },
  ];

  if (gmaCreated) {
    navigation.push({
      key: "gma",
      label: "GMA",
      href: `${dashboardHref}/gma`,
    });
  }

  if (role === "admin") {
    navigation.push(
      { key: "treasurer", label: "Treasurer", href: "/dashboard/treasurer" },
      {
        key: "board",
        label: "Board Members",
        href: `${dashboardHref}/board-members`,
      }
    );
  }

  return navigation;
}
