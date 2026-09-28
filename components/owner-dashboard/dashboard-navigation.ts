export type DashboardRole =
  | "admin"
  | "owner"
  | "sublead"
  | "treasurer"
  | "advisor"
  | "board"
  | "kas"
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
}: {
  organizationSlug: string;
  role: DashboardRole;
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

  if (role === "kas") {
    return navigation.filter(
      (item) => item.key === "dashboard" || item.key === "orders"
    );
  }

  if (role === "admin" || role === "owner" || role === "board") {
    navigation.push({
      key: "gma",
      label: "GMA",
      href: `${dashboardHref}/gma`,
    });
  }

  if (role === "admin" || role === "board") {
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
