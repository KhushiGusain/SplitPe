import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Avatar, Chip, SegmentedButtons, Button, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { formatAmount, formatCurrency } from '../utils/upi';
import { 
  moderateScale, 
  spacing, 
  padding, 
  borderRadius, 
  fontSize, 
  shadow,
  screenDimensions,
  getResponsiveValue,
  iconSize 
} from '../utils/responsive';
import { ResponsiveContainer, ResponsiveText, ResponsiveCard } from '../utils/responsiveComponents';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const { 
    theme, 
    currentUser, 
    groups, 
    expenses,
    settlements,
    calculateUserBalances,
  } = useAppStore();

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <ResponsiveText>Loading...</ResponsiveText>
      </View>
    );
  }

  // Helper function to filter expenses by period (user's share only)
  const getUserExpensesByPeriod = () => {
    const now = new Date();
    const startDate = new Date();
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    return expenses.filter(expense => {
      const date = new Date(expense.createdAt);
      return date >= startDate && expense.participants.some(p => p.userId === currentUser.id);
    });
  };
  const userPeriodExpenses = getUserExpensesByPeriod();

  // User's total spent in period (their share only)
  const periodTotal = userPeriodExpenses.reduce((sum, expense) => {
    const userParticipation = expense.participants.find(p => p.userId === currentUser.id);
    return sum + (userParticipation?.amount || 0);
  }, 0);

  // User's total spent (all time)
  const userTotalSpent = expenses.reduce((sum, expense) => {
    const userParticipation = expense.participants.find(p => p.userId === currentUser.id);
    return sum + (userParticipation?.amount || 0);
  }, 0);

  // Monthly trend (last 6 months, user's share only)
  const getUserMonthlyTrend = () => {
    const months: { month: string; amount: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear() &&
               expense.participants.some(p => p.userId === currentUser.id);
      });
      const userMonthTotal = monthExpenses.reduce((sum, expense) => {
        const userParticipation = expense.participants.find(p => p.userId === currentUser.id);
        return sum + (userParticipation?.amount || 0);
      }, 0);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: userMonthTotal,
      });
    }
    return months;
  };
  const monthlyTrend = getUserMonthlyTrend();
  const maxMonthAmount = Math.max(...monthlyTrend.map(m => m.amount));

  // Category-wise breakdown (user's share only)
  const getUserCategoryBreakdown = () => {
    const categories: { [key: string]: { amount: number; count: number; color: string } } = {
      'Trip': { amount: 0, count: 0, color: '#40c9a2' },
      'Rent': { amount: 0, count: 0, color: '#2f9c95' },
      'Dining': { amount: 0, count: 0, color: '#a3f7b5' },
      'Office Snacks': { amount: 0, count: 0, color: '#40c9a2' },
      'Party': { amount: 0, count: 0, color: '#a3f7b5' },
      'Others': { amount: 0, count: 0, color: '#2f9c95' },
    };
    userPeriodExpenses.forEach(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      const category = group?.purpose || 'Others';
      const userParticipation = expense.participants.find(p => p.userId === currentUser.id);
      if (categories[category]) {
        categories[category].amount += userParticipation?.amount || 0;
        categories[category].count += 1;
      } else {
        categories['Others'].amount += userParticipation?.amount || 0;
        categories['Others'].count += 1;
      }
    });
    return Object.entries(categories)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount);
  };
  const categoryBreakdown = getUserCategoryBreakdown();

  // Recent activity (user's share only)
  const recentExpenses = expenses
    .filter(expense => expense.participants.some(p => p.userId === currentUser.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate overall statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.isActive).length;

  // Calculate user's financial summary
  const userTotalPaid = expenses
    .filter(e => e.paidBy === currentUser.id)
    .reduce((sum, expense) => sum + expense.totalAmount, 0);

  const userTotalShare = expenses.reduce((sum, expense) => {
    const userParticipation = expense.participants.find(p => p.userId === currentUser.id);
    return sum + (userParticipation?.amount || 0);
  }, 0);

  const netBalance = userTotalPaid - userTotalShare;

  // Group performance
  const getGroupSummaries = () => {
    return groups.map(group => {
      const groupExpenses = expenses.filter(e => e.groupId === group.id);
      const totalSpent = groupExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
      const userBalances = calculateUserBalances(group.id);
      const userBalance = userBalances.find(b => b.userId === currentUser.id);
      return {
        ...group,
        totalSpent,
        expenseCount: groupExpenses.length,
        userBalance: userBalance?.netBalance || 0,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  };

  const groupSummaries = getGroupSummaries();

  // Pending settlements
  const userSettlements = settlements.filter(s => 
    (s.fromUserId === currentUser.id || s.toUserId === currentUser.id) && !s.isPaid
  );

  // Quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addExpense':
        navigation.navigate('AddExpense', { groupId: groups[0]?.id || '' });
        break;
      case 'createGroup':
        navigation.navigate('CreateGroup');
        break;
      case 'viewGroups':
        navigation.navigate('Groups' as never);
        break;
    }
  };

  // Responsive sizes
  const summaryIconSize = getResponsiveValue({
    small: 40,
    medium: 44,
    large: 48,
    xlarge: 52,
  });

  const chartHeight = getResponsiveValue({
    small: 100,
    medium: 110,
    large: 120,
    xlarge: 130,
  });

  const barWidth = getResponsiveValue({
    small: 16,
    medium: 18,
    large: 20,
    xlarge: 22,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ 
            color: theme.textColor, 
            fontWeight: '900',
            letterSpacing: -1.0,
            marginBottom: 4,
          }}>
            Dashboard
          </Text>
          <ResponsiveText 
            size="lg" 
            color={theme.textColor}
            weight="600"
            style={{ opacity: 0.7 }}
          >
            Your expense overview
          </ResponsiveText>
        </View>

        {/* Period Filter */}
        <View style={styles.periodContainer}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={(value: any) => setSelectedPeriod(value)}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <ResponsiveCard
            backgroundColor={theme.surfaceColor}
            style={[styles.summaryCard, { 
              borderWidth: 1,
              borderColor: theme.primaryColor + '20',
            }]}
          >
            <View style={styles.summaryContent}>
              <View style={[styles.summaryIconContainer, { 
                backgroundColor: theme.primaryColor + '20',
                borderRadius: borderRadius.md,
                padding: spacing.md,
              }]}>
                <Avatar.Icon
                  size={summaryIconSize}
                  icon="cash"
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                />
              </View>
              <ResponsiveText 
                size="xs" 
                color={theme.textColor}
                weight="600"
                style={{ 
                  opacity: 0.6,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginTop: spacing.sm,
                }}
              >
                {selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year'}
              </ResponsiveText>
              <ResponsiveText 
                size="2xl" 
                color={theme.textColor}
                weight="800"
                style={{ 
                  letterSpacing: -0.5,
                  marginTop: spacing.xs,
                }}
              >
                {formatCurrency(periodTotal)}
              </ResponsiveText>
            </View>
          </ResponsiveCard>

          <ResponsiveCard
            backgroundColor={theme.surfaceColor}
            style={[styles.summaryCard, { 
              borderWidth: 1,
              borderColor: theme.accentColor + '40',
            }]}
          >
            <View style={styles.summaryContent}>
              <View style={[styles.summaryIconContainer, { 
                backgroundColor: theme.accentColor + '30',
                borderRadius: borderRadius.md,
                padding: spacing.md,
              }]}>
                <Avatar.Icon
                  size={summaryIconSize}
                  icon="people"
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                />
              </View>
              <ResponsiveText 
                size="xs" 
                color={theme.textColor}
                weight="600"
                style={{ 
                  opacity: 0.6,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginTop: spacing.sm,
                }}
              >
                Active Groups
              </ResponsiveText>
              <ResponsiveText 
                size="2xl" 
                color={theme.textColor}
                weight="800"
                style={{ 
                  letterSpacing: -0.5,
                  marginTop: spacing.xs,
                }}
              >
                {activeGroups}
              </ResponsiveText>
            </View>
          </ResponsiveCard>
        </View>

        {/* Quick Actions */}
        <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
          <ResponsiveText 
            size="lg" 
            color={theme.textColor}
            weight="600"
            style={{ marginBottom: spacing.md }}
          >
            Quick Actions
          </ResponsiveText>
          <View style={styles.quickActionGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundColor }]}
              onPress={() => handleQuickAction('createGroup')}
            >
              <Avatar.Icon 
                size={moderateScale(32)} 
                icon="account-group" 
                style={{ backgroundColor: theme.accentColor }} 
              />
              <ResponsiveText 
                size="xs" 
                color={theme.textColor}
                align="center"
                style={{ marginTop: spacing.xs }}
              >
                New Group
              </ResponsiveText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundColor }]}
              onPress={() => handleQuickAction('viewGroups')}
            >
              <Avatar.Icon 
                size={moderateScale(32)} 
                icon="view-list" 
                style={{ backgroundColor: theme.primaryColor }} 
              />
              <ResponsiveText 
                size="xs" 
                color={theme.textColor}
                align="center"
                style={{ marginTop: spacing.xs }}
              >
                All Groups
              </ResponsiveText>
            </TouchableOpacity>
          </View>
        </ResponsiveCard>

        {/* Monthly Spending Trend */}
        <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
          <ResponsiveText 
            size="lg" 
            color={theme.textColor}
            weight="600"
            style={{ marginBottom: spacing.md }}
          >
            Spending Trend (Last 6 Months)
          </ResponsiveText>
          <View style={[styles.chartContainer, { height: chartHeight }]}>
            {monthlyTrend.map((month, index) => (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: Math.max((month.amount / (maxMonthAmount || 1)) * (chartHeight * 0.6), 4),
                      backgroundColor: theme.primaryColor,
                      width: barWidth,
                    }
                  ]}
                />
                <ResponsiveText 
                  size="xs" 
                  color={theme.textColor}
                  style={{ opacity: 0.7, marginTop: spacing.xs }}
                >
                  {month.month}
                </ResponsiveText>
                <ResponsiveText 
                  size="xs" 
                  color={theme.textColor}
                >
                  {formatCurrency(month.amount)}
                </ResponsiveText>
              </View>
            ))}
          </View>
        </ResponsiveCard>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
            <ResponsiveText 
              size="lg" 
              color={theme.textColor}
              weight="600"
              style={{ marginBottom: spacing.md }}
            >
              Category Breakdown ({selectedPeriod})
            </ResponsiveText>
            {categoryBreakdown.map(([category, data]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: data.color }]} />
                  <ResponsiveText 
                    size="base" 
                    color={theme.textColor}
                    weight="500"
                  >
                    {category}
                  </ResponsiveText>
                  <ResponsiveText 
                    size="xs" 
                    color={theme.textColor}
                    style={{ opacity: 0.7 }}
                  >
                    ({data.count} expenses)
                  </ResponsiveText>
                </View>
                <ResponsiveText 
                  size="base" 
                  color={theme.textColor}
                  weight="600"
                >
                  {formatCurrency(data.amount)}
                </ResponsiveText>
              </View>
            ))}
          </ResponsiveCard>
        )}

        {/* Group Performance */}
        <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
          <ResponsiveText 
            size="lg" 
            color={theme.textColor}
            weight="600"
            style={{ marginBottom: spacing.md }}
          >
            Group Performance
          </ResponsiveText>
          {groupSummaries.slice(0, 3).map(group => (
            <TouchableOpacity 
              key={group.id}
              style={styles.groupSummaryItem}
              onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
            >
              <Avatar.Icon
                size={moderateScale(36)}
                icon={group.purpose === 'Trip' ? 'airplane' : group.purpose === 'Rent' ? 'home' : 'receipt'}
                style={{ backgroundColor: theme.primaryColor }}
              />
              <View style={styles.groupSummaryInfo}>
                <ResponsiveText 
                  size="base" 
                  color={theme.textColor}
                  weight="500"
                >
                  {group.name}
                </ResponsiveText>
                <ResponsiveText 
                  size="xs" 
                  color={theme.textColor}
                  style={{ opacity: 0.7 }}
                >
                  {group.expenseCount} expenses • {formatCurrency(group.totalSpent)}
                </ResponsiveText>
              </View>
              <View style={styles.groupSummaryBalance}>
                <ResponsiveText 
                  size="base" 
                  color={group.userBalance >= 0 ? '#40c9a2' : '#2f9c95'}
                  weight="600"
                  align="right"
                >
                  {group.userBalance >= 0 ? '+' : ''}{formatCurrency(group.userBalance)}
                </ResponsiveText>
              </View>
            </TouchableOpacity>
          ))}
        </ResponsiveCard>

        {/* Balance Overview */}
        <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
          <ResponsiveText 
            size="xl" 
            color={theme.textColor}
            weight="600"
            style={{ marginBottom: spacing.md }}
          >
            Your Balance
          </ResponsiveText>
          
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <ResponsiveText 
                size="base" 
                color={theme.textColor}
                style={{ opacity: 0.7 }}
              >
                You Paid
              </ResponsiveText>
              <ResponsiveText 
                size="lg" 
                color={theme.primaryColor}
                weight="600"
              >
                {formatAmount(userTotalPaid)}
              </ResponsiveText>
            </View>
            
            <View style={styles.balanceItem}>
              <ResponsiveText 
                size="base" 
                color={theme.textColor}
                style={{ opacity: 0.7 }}
              >
                Your Share
              </ResponsiveText>
              <ResponsiveText 
                size="lg" 
                color={theme.accentColor}
                weight="600"
              >
                {formatAmount(userTotalShare)}
              </ResponsiveText>
            </View>
          </View>
          
          <View style={[styles.netBalanceCard, { backgroundColor: theme.backgroundColor }]}>
            <ResponsiveText 
              size="base" 
              color={theme.textColor}
              style={{ opacity: 0.8 }}
            >
              Net Balance
            </ResponsiveText>
            <ResponsiveText 
              size="xl" 
              color={netBalance >= 0 ? theme.primaryColor : theme.accentColor}
              weight="700"
            >
              {netBalance >= 0 ? '+' : ''}{formatAmount(netBalance)}
            </ResponsiveText>
            <ResponsiveText 
              size="xs" 
              color={theme.textColor}
              style={{ opacity: 0.6 }}
            >
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </ResponsiveText>
          </View>
        </ResponsiveCard>

        {/* Pending Settlements */}
        {userSettlements.length > 0 && (
          <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
            <ResponsiveText 
              size="xl" 
              color={theme.textColor}
              weight="600"
              style={{ marginBottom: spacing.md }}
            >
              Pending Settlements
            </ResponsiveText>
            
            {userSettlements.map(settlement => (
              <View key={settlement.id} style={styles.settlementItem}>
                <Avatar.Text
                  size={moderateScale(40)}
                  label="₹"
                  style={{ backgroundColor: '#40c9a2' }}
                  labelStyle={{ color: 'white' }}
                />
                <View style={styles.settlementInfo}>
                  <ResponsiveText 
                    size="base" 
                    color={theme.textColor}
                    weight="500"
                  >
                    {settlement.fromUserId === currentUser.id ? 'Pay' : 'Receive'} {formatAmount(settlement.amount)}
                  </ResponsiveText>
                  <ResponsiveText 
                    size="xs" 
                    color={theme.textColor}
                    style={{ opacity: 0.7 }}
                  >
                    {settlement.fromUserId === currentUser.id ? 'to' : 'from'} User
                  </ResponsiveText>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: '#2f9c95', fontSize: fontSize.xs }}
                  style={{ borderColor: '#40c9a2' }}
                >
                  Pending
                </Chip>
              </View>
            ))}
          </ResponsiveCard>
        )}

        {/* Recent Activity */}
        {recentExpenses.length > 0 && (
          <ResponsiveCard backgroundColor={theme.surfaceColor} style={styles.card}>
            <ResponsiveText 
              size="xl" 
              color={theme.textColor}
              weight="600"
              style={{ marginBottom: spacing.md }}
            >
              Recent Activity
            </ResponsiveText>
            
            {recentExpenses.map(expense => (
              <View key={expense.id} style={styles.activityItem}>
                <Avatar.Icon
                  size={moderateScale(36)}
                  icon="receipt"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <View style={styles.activityInfo}>
                  <ResponsiveText 
                    size="base" 
                    color={theme.textColor}
                    weight="500"
                  >
                    {expense.title}
                  </ResponsiveText>
                  <ResponsiveText 
                    size="xs" 
                    color={theme.textColor}
                    style={{ opacity: 0.7 }}
                  >
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </ResponsiveText>
                </View>
                <ResponsiveText 
                  size="base" 
                  color={theme.textColor}
                  weight="600"
                >
                  {formatAmount(expense.totalAmount)}
                </ResponsiveText>
              </View>
            ))}
          </ResponsiveCard>
        )}

        <View style={{ height: moderateScale(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: padding.lg,
    paddingBottom: 0,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: padding.lg,
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: padding.lg,
    paddingHorizontal: spacing.md,
  },
  summaryIconContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    margin: padding.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(163, 247, 181, 0.2)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  netBalanceCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settlementInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  periodContainer: {
    paddingHorizontal: spacing.md,
    marginTop: 0,
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#3b82f6',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  categoryDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
  },
  groupSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  groupSummaryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  groupSummaryBalance: {
    alignItems: 'flex-end',
  },
});

export default DashboardScreen; 