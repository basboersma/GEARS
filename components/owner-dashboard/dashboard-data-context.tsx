"use client";

import { createContext, useContext, useState } from "react";
import type {
  AppNotification,
  CalEvent,
  DriveFile,
  FileTreeNode,
  Member,
  Order,
  RoadmapItem,
  TodoItem,
} from "./types";

export interface DashboardData {
  organizationId: string;
  driveFolderId: string | null;
  departments: string[];
  subteams: Record<string, string[]>;
  members: Member[];
  files: DriveFile[];
  fileTree: FileTreeNode[];
  events: CalEvent[];
  todos: TodoItem[];
  roadmap: RoadmapItem[];
  orders: Order[];
  notifications: AppNotification[];
  monthlySpend: Record<
    string,
    { month: string; budget: number; spent: number }[]
  >;
}

interface DashboardDataContextValue extends DashboardData {
  addNotification: (notification: AppNotification) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null
);

export function DashboardDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardData;
}) {
  const [notifications, setNotifications] = useState(value.notifications);

  return (
    <DashboardDataContext.Provider
      value={{
        ...value,
        notifications,
        addNotification: (notification) =>
          setNotifications((current) => [notification, ...current]),
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardDataContextValue {
  const data = useContext(DashboardDataContext);
  if (!data) {
    throw new Error(
      "Dashboard data must be provided by the organization page."
    );
  }
  return data;
}
