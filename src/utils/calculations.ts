import { Expense, ExpenseParticipant, UserBalance, Settlement } from '../types';

export const calculateEqualSplit = (
  totalAmount: number,
  participantIds: string[]
): ExpenseParticipant[] => {
  const n = participantIds.length;
  if (n === 0) return [];
  const rawPerPerson = totalAmount / n;
  const roundedPerPerson = Math.round(rawPerPerson * 100) / 100;
  let participants = participantIds.map(userId => ({
    userId,
    amount: roundedPerPerson,
    isPaid: false,
  }));
  // Fix rounding error by adjusting the first few participants
  let sum = participants.reduce((acc, p) => acc + p.amount, 0);
  let diff = Math.round((totalAmount - sum) * 100) / 100;
  let i = 0;
  while (Math.abs(diff) > 0.009 && i < n) {
    participants[i].amount = Math.round((participants[i].amount + diff) * 100) / 100;
    sum = participants.reduce((acc, p) => acc + p.amount, 0);
    diff = Math.round((totalAmount - sum) * 100) / 100;
    i++;
  }
  return participants;
};

export const calculateCustomSplit = (
  totalAmount: number,
  customAmounts: { userId: string; amount: number }[]
): ExpenseParticipant[] => {
  const totalCustomAmount = customAmounts.reduce((sum, item) => sum + item.amount, 0);
  
  if (Math.abs(totalCustomAmount - totalAmount) > 0.01) {
    throw new Error('Custom split amounts do not match total amount');
  }
  
  return customAmounts.map(({ userId, amount }) => ({
    userId,
    amount,
    isPaid: false,
  }));
};

export const calculatePercentageSplit = (
  totalAmount: number,
  percentages: { userId: string; percentage: number }[]
): ExpenseParticipant[] => {
  const totalPercentage = percentages.reduce((sum, item) => sum + item.percentage, 0);
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Percentages do not add up to 100%');
  }
  
  return percentages.map(({ userId, percentage }) => ({
    userId,
    amount: Math.round((totalAmount * percentage / 100) * 100) / 100,
    isPaid: false,
  }));
};

export const optimizeSettlements = (balances: UserBalance[]): Settlement[] => {
  // Create a copy of balances to avoid mutation
  const workingBalances = balances.map(b => ({ ...b }));
  const settlements: Settlement[] = [];
  
  // Sort by net balance - highest lenders first, then highest debtors
  workingBalances.sort((a, b) => b.netBalance - a.netBalance);
  
  let leftIndex = 0; // Points to lenders (positive balance)
  let rightIndex = workingBalances.length - 1; // Points to debtors (negative balance)
  
  while (leftIndex < rightIndex) {
    const lender = workingBalances[leftIndex];
    const debtor = workingBalances[rightIndex];
    
    // Skip if no balance
    if (Math.abs(lender.netBalance) < 0.01) {
      leftIndex++;
      continue;
    }
    if (Math.abs(debtor.netBalance) < 0.01) {
      rightIndex--;
      continue;
    }
    
    // Skip if person doesn't owe or isn't owed money
    if (lender.netBalance <= 0) {
      leftIndex++;
      continue;
    }
    if (debtor.netBalance >= 0) {
      rightIndex--;
      continue;
    }
    
    // Calculate settlement amount
    const settlementAmount = Math.min(
      lender.netBalance,
      Math.abs(debtor.netBalance)
    );
    
    if (settlementAmount > 0.01) {
      settlements.push({
        id: `${Date.now()}_${leftIndex}_${rightIndex}`,
        fromUserId: debtor.userId,
        toUserId: lender.userId,
        amount: Math.round(settlementAmount * 100) / 100,
        groupId: lender.groupId,
        expenseIds: [], // This would be populated based on specific expenses
        isPaid: false,
        createdAt: new Date(),
      });
      
      // Update balances
      lender.netBalance -= settlementAmount;
      debtor.netBalance += settlementAmount;
    }
    
    // Move pointers if balance is settled
    if (Math.abs(lender.netBalance) < 0.01) {
      leftIndex++;
    }
    if (Math.abs(debtor.netBalance) < 0.01) {
      rightIndex--;
    }
  }
  
  return settlements;
};

export const calculateGroupSummary = (
  expenses: Expense[],
  settlements: Settlement[]
) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const totalSettled = settlements
    .filter(s => s.isPaid)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  const totalPending = settlements
    .filter(s => !s.isPaid)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  
  return {
    totalExpenses,
    totalSettled,
    totalPending,
    settlementRate: totalExpenses > 0 ? (totalSettled / totalExpenses) * 100 : 0,
  };
};

export const calculateUserExpenseSummary = (
  userId: string,
  expenses: Expense[],
  settlements: Settlement[]
) => {
  const userExpenses = expenses.filter(e => e.paidBy === userId);
  const totalPaid = userExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  
  const userShareInExpenses = expenses.reduce((sum, expense) => {
    const userParticipation = expense.participants.find(p => p.userId === userId);
    return sum + (userParticipation?.amount || 0);
  }, 0);
  
  const amountOwedToUser = settlements
    .filter(s => s.toUserId === userId && !s.isPaid)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  
  const amountUserOwes = settlements
    .filter(s => s.fromUserId === userId && !s.isPaid)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  
  return {
    totalPaid,
    totalShare: userShareInExpenses,
    netBalance: totalPaid - userShareInExpenses,
    amountOwedToUser,
    amountUserOwes,
  };
};

export const validateExpenseParticipants = (
  totalAmount: number,
  participants: ExpenseParticipant[]
): { isValid: boolean; error?: string } => {
  if (participants.length === 0) {
    return { isValid: false, error: 'At least one participant is required' };
  }
  
  const totalParticipantAmount = participants.reduce((sum, p) => sum + p.amount, 0);
  const difference = Math.abs(totalAmount - totalParticipantAmount);
  
  if (difference > 0.01) {
    return { 
      isValid: false, 
      error: `Participant amounts (₹${totalParticipantAmount.toFixed(2)}) do not match total amount (₹${totalAmount.toFixed(2)})` 
    };
  }
  
  const negativeAmounts = participants.filter(p => p.amount < 0);
  if (negativeAmounts.length > 0) {
    return { isValid: false, error: 'Participant amounts cannot be negative' };
  }
  
  return { isValid: true };
};

export const roundToTwoDecimals = (num: number): number => {
  return Math.round(num * 100) / 100;
}; 