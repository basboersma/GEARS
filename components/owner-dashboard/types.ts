export type EventType = "event" | "meeting";
export type InviteStatus = "pending" | "accepted" | "declined";
export type CalView = "day" | "week" | "month";

export interface MemberInvite {
  memberId: string;
  status: InviteStatus;
}

export interface VoteGroup {
  for: string[];
  against: string[];
  abstain: string[];
}

export interface DiscussionPoint {
  id: string;
  title: string;
  notes: string;
  votingEnabled: boolean;
  votes: VoteGroup;
}

export interface CalEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  color: string;
  description: string;
  location: string;
  invitees: MemberInvite[];
  sendMail: boolean;
  linkedFiles: string[];
  localFiles: string[];
  repeat: { every: number; unit: "days" | "weeks" } | null;
  discussionPoints: DiscussionPoint[];
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  description: string;
  done: boolean;
  color: string;
  assignedMembers: string[];
  linkedFiles: string[];
  addToCalendar: boolean;
  calendarDate: string;
  subtasks: Subtask[];
  dueDate?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  type: "pdf" | "doc" | "sheet" | "slide" | "other";
  size: string;
  modified: string;
  url: string;
  thumbnailUrl?: string;
}

export type FileTreeNode =
  | { kind: "folder"; id: string; name: string; children: FileTreeNode[] }
  | {
      kind: "file";
      id: string;
      name: string;
      type: DriveFile["type"];
      size: string;
      modified: string;
      url: string;
      thumbnailUrl?: string;
    };

export interface Member {
  id: string;
  name: string;
  email: string;
  team: string;
  department: string;
  role: string;
  avatar: string;
  status: "active" | "inactive";
  isSubLead: boolean;
  strikes: number;
  gender?: string | null;
  nationality?: string | null;
  study?: string | null;
}

export interface TeamAssignment {
  id: string;
  departmentId: string | null;
  memberId: string;
  isSubLead: boolean;
  isAdvisor: boolean;
  isTreasurer: boolean;
}

export interface TeamHistorySnapshot
  extends Omit<TeamAssignment, "departmentId"> {
  snapshotAt: string;
  departmentId: string | null;
  removed: boolean;
}

export interface RoadmapItem {
  id: string;
  title: string;
  department: string;
  startDate: string;
  endDate: string;
  color: string;
  progress: number;
}

export interface OrderLineItem {
  id?: string;
  name: string;
  description?: string;
  qty: number;
  price: number;
  link?: string;
  orderType?: string;
  urgency?: string;
  comments?: string;
  status?: string;
  photoNeeded?: boolean;
  photoUploaded?: boolean;
  invoiceAdded?: boolean;
}
export interface Order {
  id: string;
  organizationId?: string;
  organizationName?: string;
  submittedByRole?: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  department: string;
  submittedBy?: string;
  approvedBy?: string;
  link?: string;
  recurring?: boolean;
  recurringQuantity?: number | null;
  recurringUnit?: string | null;
  recurringEndAt?: string | null;
  status?: string;
  ordered?: boolean;
  delivered?: boolean;
  finalized?: boolean;
  canceled?: boolean;
  accepted?: "neutral" | "accepted" | "denied";
  state?: "Functional" | "Broken" | "Discarded";
  items: OrderLineItem[];
}

export interface BudgetSubSub {
  name: string;
  budget: number;
  spent: number;
}
export interface BudgetSub {
  name: string;
  budget: number;
  spent: number;
  subs?: BudgetSubSub[];
}
export interface BudgetDept {
  name: string;
  budget: number;
  spent: number;
  color: string;
  subs: BudgetSub[];
}
export interface BudgetData {
  total: number;
  spent: number;
  departments: BudgetDept[];
}

export interface AppNotification {
  id: string;
  type: "order" | "member" | "event" | "todo" | "budget";
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderRequestId?: string;
}

export interface ReimbursementRequest {
  id: string;
  organizationId: string;
  name: string;
  department: string;
  submittedBy: string;
  link: string;
  pricePerPiece: number;
  quantity: number;
  orderType: string;
  urgency: string;
  comments: string;
  status: string;
  submittedAt: string;
}
