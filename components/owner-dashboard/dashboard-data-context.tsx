"use client";

import { createContext, useContext } from "react";
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

const DashboardDataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardData;
}) {
  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardData {
  const data = useContext(DashboardDataContext);
  if (!data) {
    throw new Error(
      "Dashboard data must be provided by the organization page."
    );
  }
  return data;
}
