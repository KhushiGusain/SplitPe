export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  upiId?: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  purpose: 'Trip' | 'Rent' | 'Party' | 'Office Snacks' | 'Dining' | 'Others';
  members: User[];
  createdBy: string;
  createdAt: Date;
  totalExpenses: number;
  currency: string;
  isActive: boolean;
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  participants: string[]; // user IDs who share this item
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  totalAmount: number;
  paidBy: string; // user ID
  splitType: 'equal' | 'custom' | 'itemized';
  participants: ExpenseParticipant[];
  items?: ExpenseItem[]; // for itemized splitting
  upiTransactionId?: string;
  receiptImage?: string;
  receiptPhoto?: string;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
}

export interface ExpenseParticipant {
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId: string;
  expenseIds: string[];
  isPaid: boolean;
  paidAt?: Date;
  upiTransactionId?: string;
  createdAt: Date;
}

export interface UserBalance {
  userId: string;
  groupId: string;
  totalOwed: number; // amount they owe to others
  totalLent: number; // amount others owe to them
  netBalance: number; // positive = they are owed money, negative = they owe money
}

export interface GroupSummary {
  groupId: string;
  totalExpenses: number;
  totalSettled: number;
  totalPending: number;
  memberBalances: UserBalance[];
  recentExpenses: Expense[];
}

export interface UPITransaction {
  id: string;
  amount: number;
  description: string;
  merchantName?: string;
  transactionId: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
}

export interface NotificationSettings {
  expenseReminders: boolean;
  settlementReminders: boolean;
  newExpenseAlerts: boolean;
  groupInvites: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface AppTheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
}

export type RootStackParamList = {
  Main: undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: string };
  AddExpense: { groupId: string };
  EditExpense: { expenseId: string };
  ExpenseDetails: { expenseId: string };
  Settlement: { groupId: string };
  Profile: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  ContactSupport: undefined;
};

export type TabParamList = {
  Groups: undefined;
  Expenses: undefined;
  Dashboard: undefined;
  Profile: undefined;
}; 