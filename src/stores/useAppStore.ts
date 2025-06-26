import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { 
  User, 
  Group, 
  Expense, 
  Settlement, 
  UserBalance, 
  AppTheme, 
  NotificationSettings 
} from '../types';

interface AppState {
  // User state
  currentUser: User | null;
  users: User[];
  
  // Groups state
  groups: Group[];
  activeGroupId: string | null;
  
  // Expenses state
  expenses: Expense[];
  settlements: Settlement[];
  userBalances: UserBalance[];
  
  // UI state
  theme: AppTheme;
  notificationSettings: NotificationSettings;
  isLoading: boolean;
  currency: string;
  
  // Actions
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  
  createGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  clearAllExpenses: () => void;
  
  markExpensePaid: (expenseId: string, participantUserId: string) => void;
  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
  markSettlementPaid: (settlementId: string, upiTransactionId?: string) => void;
  
  calculateUserBalances: (groupId: string) => UserBalance[];
  getGroupExpenses: (groupId: string) => Expense[];
  getUserSettlements: (userId: string, groupId?: string) => Settlement[];
  
  setTheme: (theme: Partial<AppTheme>) => void;
  resetTheme: () => void;
  toggleThemeMode: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  setLoading: (loading: boolean) => void;
  setCurrency: (currency: string) => void;
}

const defaultTheme: AppTheme = {
  mode: 'light',
  primaryColor: '#40c9a2',
  backgroundColor: '#ffffff',
  surfaceColor: '#e5f9e0',
  textColor: '#2f9c95',
  accentColor: '#a3f7b5',
};

const defaultNotificationSettings: NotificationSettings = {
  expenseReminders: true,
  settlementReminders: true,
  newExpenseAlerts: true,
  groupInvites: true,
  reminderFrequency: 'weekly',
};

const defaultCurrency = 'INR';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [],
      groups: [],
      activeGroupId: null,
      expenses: [],
      settlements: [],
      userBalances: [],
      theme: defaultTheme,
      notificationSettings: defaultNotificationSettings,
      isLoading: false,
      currency: defaultCurrency,

      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      addUser: (user) => set((state) => ({
        users: state.users.some(u => u.phone === user.phone || (user.email && u.email === user.email))
          ? state.users
          : [...state.users, user],
      })),
      
      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ),
      })),

      // Group actions
      createGroup: (groupData) => set((state) => {
        const newGroup: Group = {
          ...groupData,
          id: Date.now().toString(),
          createdAt: new Date(),
          totalExpenses: 0,
          currency: 'INR',
          isActive: true,
        };
        
        // Show notification popup for group creation
        if (state.notificationSettings.groupInvites) {
          setTimeout(() => {
            Alert.alert(
              '🎉 Group Created Successfully!',
              `You've created "${newGroup.name}" group with ${newGroup.members.length} members. Ready to start tracking expenses and splitting bills!`,
              [
                { text: 'Add Expense', style: 'default' },
                { text: 'Got it!', style: 'cancel' }
              ]
            );
          }, 100);
        }
        
        return { groups: [...state.groups, newGroup] };
      }),
      
      updateGroup: (groupId, updates) => set((state) => ({
        groups: state.groups.map(group => 
          group.id === groupId ? { ...group, ...updates } : group
        ),
      })),
      
      deleteGroup: (groupId) => set((state) => ({
        groups: state.groups.filter(group => group.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      })),
      
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      // Expense actions
      addExpense: (expenseData) => set((state) => {
        const newExpense: Expense = {
          ...expenseData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Update group total expenses
        const updatedGroups = state.groups.map(group => 
          group.id === expenseData.groupId 
            ? { ...group, totalExpenses: group.totalExpenses + expenseData.totalAmount }
            : group
        );
        
        // Show notification popup for expense addition
        if (state.notificationSettings.newExpenseAlerts) {
          const group = state.groups.find(g => g.id === expenseData.groupId);
          const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
          const isCurrentUserPaying = expenseData.paidBy === state.currentUser?.id;
          
          const title = isCurrentUserPaying ? '✅ Your Expense Added!' : '💰 New Expense Added!';
          const message = isCurrentUserPaying 
            ? `You added "${newExpense.title}" expense of ${formatAmount(newExpense.totalAmount)} to "${group?.name}" group. Split between ${newExpense.participants.length} members.`
            : `"${newExpense.title}" expense of ${formatAmount(newExpense.totalAmount)} has been added to "${group?.name}" group. Split between ${newExpense.participants.length} members.`;
          
          setTimeout(() => {
            Alert.alert(
              title,
              message,
              [
                { text: 'View Group', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
          }, 100);
        }
        
        return { 
          expenses: [...state.expenses, newExpense],
          groups: updatedGroups,
        };
      }),
      
      updateExpense: (expenseId, updates) => set((state) => ({
        expenses: state.expenses.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...updates, updatedAt: new Date() }
            : expense
        ),
      })),
      
      deleteExpense: (expenseId) => set((state) => {
        const expense = state.expenses.find(e => e.id === expenseId);
        if (!expense) return state;
        
        const updatedGroups = state.groups.map(group => 
          group.id === expense.groupId 
            ? { ...group, totalExpenses: group.totalExpenses - expense.totalAmount }
            : group
        );
        
        return {
          expenses: state.expenses.filter(e => e.id !== expenseId),
          groups: updatedGroups,
        };
      }),

      clearAllExpenses: () => set((state) => {
        // Reset all group total expenses to 0
        const updatedGroups = state.groups.map(group => ({
          ...group,
          totalExpenses: 0,
        }));
        
        return {
          expenses: [],
          groups: updatedGroups,
        };
      }),

      markExpensePaid: (expenseId, participantUserId) => set((state) => ({
        expenses: state.expenses.map(expense => 
          expense.id === expenseId 
            ? {
                ...expense,
                participants: expense.participants.map(participant => 
                  participant.userId === participantUserId
                    ? { ...participant, isPaid: true, paidAt: new Date() }
                    : participant
                ),
                updatedAt: new Date(),
              }
            : expense
        ),
      })),

      // Settlement actions
      addSettlement: (settlementData) => set((state) => {
        const newSettlement: Settlement = {
          ...settlementData,
          id: Date.now().toString(),
          createdAt: new Date(),
        };
        return { settlements: [...state.settlements, newSettlement] };
      }),
      
      markSettlementPaid: (settlementId, upiTransactionId) => set((state) => ({
        settlements: state.settlements.map(settlement => 
          settlement.id === settlementId
            ? { 
                ...settlement, 
                isPaid: true, 
                paidAt: new Date(),
                upiTransactionId,
              }
            : settlement
        ),
      })),

      // Calculation helpers
      calculateUserBalances: (groupId) => {
        const state = get();
        const groupExpenses = state.expenses.filter(e => e.groupId === groupId);
        const balanceMap = new Map<string, UserBalance>();
        
        // Initialize balances for all group members
        const group = state.groups.find(g => g.id === groupId);
        if (!group) return [];
        
        group.members.forEach(member => {
          balanceMap.set(member.id, {
            userId: member.id,
            groupId,
            totalOwed: 0,
            totalLent: 0,
            netBalance: 0,
          });
        });
        
        // Calculate from expenses
        groupExpenses.forEach(expense => {
          const paidByBalance = balanceMap.get(expense.paidBy);
          if (paidByBalance) {
            // Add the full amount they paid
            paidByBalance.totalLent += expense.totalAmount;
          }
          
          expense.participants.forEach(participant => {
            const participantBalance = balanceMap.get(participant.userId);
            if (participantBalance) {
              // Only add to totalOwed if not paid
              if (!participant.isPaid) {
                participantBalance.totalOwed += participant.amount;
              }
            }
          });
        });
        
        // Calculate net balances
        balanceMap.forEach((balance) => {
          // Net balance = what they paid - what they owe (only unpaid shares)
          balance.netBalance = balance.totalLent - balance.totalOwed;
        });
        
        return Array.from(balanceMap.values());
      },
      
      getGroupExpenses: (groupId) => {
        const state = get();
        return state.expenses.filter(e => e.groupId === groupId);
      },
      
      getUserSettlements: (userId, groupId) => {
        const state = get();
        return state.settlements.filter(s => 
          (s.fromUserId === userId || s.toUserId === userId) &&
          (!groupId || s.groupId === groupId)
        );
      },

      // Theme actions
      setTheme: (themeUpdates) => set((state) => ({
        theme: { ...state.theme, ...themeUpdates },
      })),
      
      resetTheme: () => set(() => ({
        theme: defaultTheme,
      })),
      
      toggleThemeMode: () => set((state) => ({
        theme: {
          ...state.theme,
          mode: state.theme.mode === 'light' ? 'dark' : 'light',
          primaryColor: '#40c9a2',
          backgroundColor: state.theme.mode === 'light' ? '#181f23' : '#ffffff',
          surfaceColor: state.theme.mode === 'light' ? '#232b32' : '#e5f9e0',
          textColor: state.theme.mode === 'light' ? '#e5f9e0' : '#232b32',
          accentColor: '#a3f7b5',
        },
      })),
      
      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),

      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'splitpe-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        groups: state.groups,
        expenses: state.expenses,
        settlements: state.settlements,
        theme: state.theme,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
); 