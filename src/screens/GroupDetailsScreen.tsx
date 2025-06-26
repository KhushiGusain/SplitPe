import React, { useState, useLayoutEffect, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Chip, 
  FAB, 
  IconButton,
  Divider,
  Button,
  SegmentedButtons,
  Menu,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { formatAmount, formatCurrency, openUPIPayment } from '../utils/upi';
import { optimizeSettlements } from '../utils/calculations';

type GroupDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type GroupDetailsScreenRouteProp = RouteProp<RootStackParamList, 'GroupDetails'>;

const GroupDetailsScreen = () => {
  const navigation = useNavigation<GroupDetailsScreenNavigationProp>();
  const route = useRoute<GroupDetailsScreenRouteProp>();
  const { groupId } = route.params;

  const { 
    theme, 
    currentUser, 
    groups,
    users,
    expenses,
    settlements,
    calculateUserBalances,
    getGroupExpenses,
    markExpensePaid,
    addSettlement,
    deleteGroup,
    deleteExpense,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements'>('expenses');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [markedAsPaid, setMarkedAsPaid] = useState<Set<string>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState('');

  // Get group data
  const group = groups.find(g => g.id === groupId);
  const groupExpenses = getGroupExpenses(groupId);
  const memberBalances = calculateUserBalances(groupId);
  const suggestedSettlements = memberBalances.length > 0 ? optimizeSettlements(memberBalances) : [];

  // Force re-render when expenses change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [expenses]);

  // Reset marked as paid state when group changes
  useEffect(() => {
    setMarkedAsPaid(new Set());
  }, [groupId]);

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group?.name}"?\n\nThis group has:\n• ${group?.members.length} members\n• ${groupExpenses.length} expenses\n• Total expenses: ${formatCurrency(group?.totalExpenses || 0)}\n\nThis action cannot be undone and will remove all expenses and data associated with this group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Group', 
          onPress: () => {
            deleteGroup(groupId);
            navigation.navigate('Main');
            Alert.alert('Success', 'Group deleted successfully!');
          }
        },
      ]
    );
  };

  console.log('GroupDetailsScreen debug:', {
    groupId,
    group: group ? { id: group.id, name: group.name } : null,
    groupExpensesCount: groupExpenses.length,
    currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
    theme: theme ? 'loaded' : 'not loaded',
    forceUpdate
  });

  // Set header options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name || 'Group Details',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
                iconColor={theme.textColor}
              />
            }
            contentStyle={{ borderRadius: 16, minWidth: 180 }}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setShowDeleteDialog(true);
              }}
              title="Delete Group"
              leadingIcon={({ color, size }) => (
                <Ionicons name="trash-outline" size={18} color={theme.primaryColor} style={{ marginRight: 4 }} />
              )}
              titleStyle={{ color: theme.primaryColor, fontWeight: '500', fontSize: 15 }}
              style={{ borderRadius: 8, marginVertical: 0, minHeight: 36, paddingVertical: 0, paddingHorizontal: 8 }}
            />
          </Menu>
        </View>
      ),
    });
  }, [navigation, group, theme, menuVisible, setMenuVisible]);

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.textColor} style={{ opacity: 0.3 }} />
          <Text variant="titleLarge" style={{ color: theme.textColor, textAlign: 'center', marginTop: 16 }}>
            Group Not Found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }}>
            The group you're looking for doesn't exist or has been deleted.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={{ marginTop: 24, backgroundColor: theme.primaryColor }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    const user = group.members.find(m => m.id === userId);
    return user?.name || 'Unknown';
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 5) return '#40c9a2'; // Mint for significant positive
    if (balance < -5) return '#2f9c95'; // Persian green for significant negative
    return theme.textColor; // Neutral for small amounts
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { groupId });
  };

  const handleExpensePress = (expenseId: string) => {
    navigation.navigate('ExpenseDetails', { expenseId });
  };

  const handleMarkPaid = (expenseId: string, participantId: string) => {
    console.log('handleMarkPaid called with:', { expenseId, participantId });
    
    // Log the current state before update
    const currentExpense = expenses.find(e => e.id === expenseId);
    console.log('Current expense before update:', currentExpense);
    
    Alert.alert(
      'Mark as Paid',
      'Mark this expense as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Paid', 
          onPress: () => {
            console.log('Marking expense as paid:', { expenseId, participantId });
            
            // Update local state immediately for UI responsiveness
            setMarkedAsPaid(prev => new Set([...prev, expenseId]));
            
            // Update the store
            markExpensePaid(expenseId, participantId);
            console.log('markExpensePaid called successfully');
            
            // Log the state after update
            setTimeout(() => {
              const updatedExpense = expenses.find(e => e.id === expenseId);
              console.log('Updated expense after markExpensePaid:', updatedExpense);
              console.log('All expenses after update:', expenses);
            }, 100);
            
            Alert.alert('Success', 'Payment marked as paid!');
          }
        },
      ]
    );
  };

  const handleSettlement = (settlement: any) => {
    setSelectedSettlement(settlement);
    setSettlementDialogVisible(true);
    setCopyStatus('');
  };

  const handleCopyUPI = () => {
    if (!selectedSettlement) return;
    
    // Find the expense(s) that created this debt
    const relevantExpenses = groupExpenses.filter(expense => {
      // Check if this expense involves the debtor (fromUserId) owing money
      const debtorParticipation = expense.participants.find(p => p.userId === selectedSettlement.fromUserId);
      return debtorParticipation && !debtorParticipation.isPaid && expense.paidBy === selectedSettlement.toUserId;
    });
    
    // Get UPI ID from the most recent relevant expense
    const mostRecentExpense = relevantExpenses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    const upiId = mostRecentExpense?.upiTransactionId || 'No UPI ID available';
    
    if (upiId !== 'No UPI ID available') {
      if (typeof window !== 'undefined' && window.navigator?.clipboard) {
        window.navigator.clipboard.writeText(upiId);
        setCopyStatus('Copied!');
      } else if (globalThis?.navigator?.clipboard) {
        globalThis.navigator.clipboard.writeText(upiId);
        setCopyStatus('Copied!');
      } else {
        setCopyStatus('UPI ID copied!');
      }
    } else {
      setCopyStatus('No UPI ID available');
    }
    setTimeout(() => setCopyStatus(''), 1200);
  };

  const handleMarkSettlementPaid = () => {
    if (!selectedSettlement) return;
    addSettlement({ ...selectedSettlement, isPaid: true });
    setSettlementDialogVisible(false);
    setTimeout(() => {
      Alert.alert('Success', 'Settlement marked as paid!');
    }, 300);
  };

  const getPurposeColor = (purpose: string) => {
    const colors: { [key: string]: string } = {
      'Trip': '#40c9a2',
      'Rent': '#2f9c95',
      'Party': '#a3f7b5',
      'Office Snacks': '#40c9a2',
      'Dining': '#2f9c95',
      'Others': '#a3f7b5',
    };
    return colors[purpose] || '#40c9a2';
  };

  // Helper to check if all participants (except payer) have paid
  const isExpenseFullyPaid = (expense: { participants: { isPaid: boolean; userId: string }[]; paidBy: string }) =>
    expense.participants.every((p: { isPaid: boolean; userId: string }) => p.isPaid || p.userId === expense.paidBy);

  const renderExpenses = () => (
    <View style={styles.tabContent}>
      {groupExpenses.length > 0 ? (
        groupExpenses
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((expense) => {
            const userParticipation = expense.participants.find(p => p.userId === currentUser?.id);
            const isMarkedAsPaidLocally = markedAsPaid.has(expense.id);
            const userOwes = userParticipation && !userParticipation.isPaid && !isMarkedAsPaidLocally;

            console.log('Expense debug:', {
              expenseId: expense.id,
              expenseTitle: expense.title,
              currentUserId: currentUser?.id,
              userParticipation: userParticipation ? { 
                userId: userParticipation.userId, 
                amount: userParticipation.amount, 
                isPaid: userParticipation.isPaid 
              } : null,
              isMarkedAsPaidLocally,
              userOwes,
              paidBy: expense.paidBy
            });

            return (
              <TouchableOpacity 
                key={`${expense.id}-${forceUpdate}`}
                onPress={() => handleExpensePress(expense.id)}
                activeOpacity={0.7}
              >
                <Card style={[styles.expenseCard, { backgroundColor: theme.surfaceColor }]}>
                  <Card.Content style={styles.expenseContent}>
                    {/* Header */}
                    <View style={styles.expenseHeader}>
                      <View style={styles.expenseLeft}>
                        <Avatar.Icon
                          size={36}
                          icon="receipt"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <View style={styles.expenseInfo}>
                          <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '600' }}>
                            {expense.title}
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>
                            Paid by {getUserName(expense.paidBy)} • {new Date(expense.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text variant="titleMedium" style={{ color: theme.textColor, fontWeight: '700' }}>
                          {formatCurrency(expense.totalAmount)}
                        </Text>
                        {userParticipation && (
                          <Text 
                            variant="bodySmall" 
                            style={{ 
                              color: getBalanceColor(expense.totalAmount),
                              textAlign: 'right'
                            }}
                          >
                            {expense.totalAmount >= 0 ? '+' : ''}{formatCurrency(expense.totalAmount)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Description */}
                    {expense.description && (
                      <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.8, marginTop: 8 }}>
                        {expense.description}
                      </Text>
                    )}

                    {/* Action */}
                    <View style={styles.expenseAction}>
                      {isExpenseFullyPaid(expense) ? (
                        <Chip
                          mode="flat"
                          style={{ backgroundColor: '#40c9a2' }}
                          textStyle={{ color: 'white', fontSize: 12, fontWeight: '600' }}
                        >
                          ✓ Paid
                        </Chip>
                      ) : (
                        <Button
                          mode="contained"
                          compact
                          onPress={() => {
                            expense.participants.forEach(p => {
                              if (!p.isPaid && p.userId !== expense.paidBy) {
                                markExpensePaid(expense.id, p.userId);
                              }
                            });
                          }}
                          style={{ backgroundColor: theme.primaryColor }}
                          labelStyle={{ color: 'white', fontSize: 12 }}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={60} color={theme.textColor} style={{ opacity: 0.3 }} />
          <Text variant="titleLarge" style={{ color: theme.textColor, textAlign: 'center', marginTop: 16 }}>
            No Expenses Yet
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }}>
            Add your first expense to get started
          </Text>
        </View>
      )}
    </View>
  );

  const renderBalances = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.summaryCard, { backgroundColor: theme.surfaceColor }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Member Balances
          </Text>
          
          {memberBalances.map((balance) => {
            const member = group.members.find(m => m.id === balance.userId);
            if (!member) return null;
            const isCurrentUser = member.id === currentUser?.id;
            const isPayer = groupExpenses.some(e => e.paidBy === member.id);
            return (
              <View key={balance.userId} style={styles.balanceItem}>
                <View style={styles.balanceLeft}>
                  <Avatar.Text
                    size={40}
                    label={member.name.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.primaryColor }}
                    labelStyle={{ color: 'white' }}
                  />
                  <View style={styles.balanceInfo}>
                    <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '500' }}>
                      {isCurrentUser ? 'You' : member.name}
                      {isPayer && (
                        <Text style={{ color: theme.primaryColor, fontSize: 12 }}> (Payer)</Text>
                      )}
                    </Text>
                  </View>
                </View>
                <View style={styles.balanceRight}>
                  <Text 
                    variant="titleMedium" 
                    style={{ 
                      color: getBalanceColor(balance.netBalance),
                      fontWeight: '700',
                      textAlign: 'right'
                    }}
                  >
                    {Math.abs(balance.netBalance) < 1 
                      ? '✓ Settled' 
                      : balance.netBalance > 0 
                      ? `+${formatCurrency(balance.netBalance)}` 
                      : `-${formatCurrency(Math.abs(balance.netBalance))}`
                    }
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: getBalanceColor(balance.netBalance),
                      textAlign: 'right'
                    }}
                  >
                    {Math.abs(balance.netBalance) < 1 
                      ? '' 
                      : balance.netBalance > 0 
                      ? 'Gets back' 
                      : 'Owes'
                    }
                  </Text>
                </View>
              </View>
            );
          })}
        </Card.Content>
      </Card>
    </View>
  );

  const renderSettlements = () => (
    <View style={styles.tabContent}>
      {suggestedSettlements.length > 0 ? (
        <>
          <Card style={[styles.summaryCard, { backgroundColor: theme.surfaceColor }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 8, fontWeight: '600' }}>
                Suggested Settlements
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7, marginBottom: 16 }}>
                Optimized to minimize transactions
              </Text>
              
              {suggestedSettlements.map((settlement, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.settlementItem}
                  onPress={() => handleSettlement(settlement)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settlementFlow}>
                    <Avatar.Text
                      size={32}
                      label={getUserName(settlement.fromUserId).charAt(0)}
                      style={{ backgroundColor: '#2f9c95' }}
                      labelStyle={{ color: 'white', fontSize: 12 }}
                    />
                    <View style={styles.settlementArrow}>
                      <Ionicons name="arrow-forward" size={20} color={theme.primaryColor} />
                      <Text variant="bodySmall" style={{ color: theme.primaryColor, fontWeight: '600' }}>
                        {formatCurrency(settlement.amount)}
                      </Text>
                    </View>
                    <Avatar.Text
                      size={32}
                      label={getUserName(settlement.toUserId).charAt(0)}
                      style={{ backgroundColor: '#40c9a2' }}
                      labelStyle={{ color: 'white', fontSize: 12 }}
                    />
                  </View>
                  <View style={styles.settlementInfo}>
                    <Text variant="bodyMedium" style={{ color: '#111' }}>
                      {getUserName(settlement.fromUserId)} pays {getUserName(settlement.toUserId)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#111', opacity: 0.7 }}>
                      Tap to view UPI ID & settle
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={60} color="#40c9a2" style={{ opacity: 0.6 }} />
          <Text variant="titleLarge" style={{ color: theme.textColor, textAlign: 'center', marginTop: 16 }}>
            All Settled Up!
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }}>
            No pending settlements for this group
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Group Header */}
      <Card style={[styles.headerCard, { backgroundColor: theme.surfaceColor }]}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar.Icon
              size={50}
              icon={group.purpose === 'Trip' ? 'airplane' : group.purpose === 'Rent' ? 'home' : 'receipt'}
              style={{ backgroundColor: getPurposeColor(group.purpose) }}
            />
            <View style={styles.headerInfo}>
              <Text variant="titleLarge" style={{ color: theme.textColor, fontWeight: '700' }}>
                {group.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                {group.members.length} members • {groupExpenses.length} expenses
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.6 }}>
                Total: {formatCurrency(group.totalExpenses)}
              </Text>
            </View>
          </View>
          <Chip
            mode="outlined"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: getPurposeColor(group.purpose),
            }}
            textStyle={{ color: getPurposeColor(group.purpose) }}
          >
            {group.purpose}
          </Chip>
        </Card.Content>
      </Card>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value: any) => setActiveTab(value)}
          buttons={[
            { value: 'expenses', label: 'Expenses' },
            { value: 'balances', label: 'Balances' },
            { value: 'settlements', label: 'Settle' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'balances' && renderBalances()}
        {activeTab === 'settlements' && renderSettlements()}
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.primaryColor }]}
        onPress={handleAddExpense}
        label="Add Expense"
      />

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: theme.primaryColor, fontWeight: 'bold', textAlign: 'center' }}>Delete Group?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.textColor, textAlign: 'center', marginBottom: 8 }}>
              Are you sure you want to delete "{group?.name}"?
            </Text>
            <Text style={{ color: theme.textColor, textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
              This will <Text style={{ color: theme.primaryColor, fontWeight: 'bold' }}>delete all expenses</Text> in the group and cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteDialog(false)}
              style={{ borderRadius: 8, borderColor: theme.primaryColor }}
              textColor={theme.primaryColor}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setShowDeleteDialog(false);
                deleteGroup(groupId);
                expenses.filter(e => e.groupId === groupId).forEach(e => deleteExpense(e.id));
                navigation.navigate('Main');
                setTimeout(() => {
                  Alert.alert('Success', 'Group and all related expenses deleted!');
                }, 300);
              }}
              style={{ backgroundColor: theme.primaryColor, borderRadius: 8 }}
              textColor="white"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={settlementDialogVisible}
          onDismiss={() => setSettlementDialogVisible(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: theme.primaryColor, fontWeight: 'bold', textAlign: 'center' }}>Settle Payment</Dialog.Title>
          <Dialog.Content>
            {selectedSettlement && (() => {
              // Find the expense(s) that created this debt
              const relevantExpenses = groupExpenses.filter(expense => {
                const debtorParticipation = expense.participants.find(p => p.userId === selectedSettlement.fromUserId);
                return debtorParticipation && !debtorParticipation.isPaid && expense.paidBy === selectedSettlement.toUserId;
              });
              
              // Get UPI ID from the most recent relevant expense
              const mostRecentExpense = relevantExpenses.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              
              const upiId = mostRecentExpense?.upiTransactionId || 'No UPI ID available';
              
              return (
                <>
                  <Text style={{ color: theme.textColor, textAlign: 'center', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>{getUserName(selectedSettlement.fromUserId)}</Text> pays <Text style={{ fontWeight: 'bold' }}>{formatCurrency(selectedSettlement.amount)}</Text> to <Text style={{ fontWeight: 'bold' }}>{getUserName(selectedSettlement.toUserId)}</Text>
                  </Text>
                  <Text style={{ color: theme.textColor, textAlign: 'center', marginBottom: 8 }}>
                    UPI ID: <Text style={{ color: theme.primaryColor, fontWeight: 'bold' }}>{upiId}</Text>
                  </Text>
                  {copyStatus ? (
                    <Text style={{ color: theme.primaryColor, textAlign: 'center', marginBottom: 8 }}>{copyStatus}</Text>
                  ) : null}
                  <Text style={{ color: theme.textColor, textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
                    Pay this amount to the above UPI ID and mark as paid.
                  </Text>
                </>
              );
            })()}
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Button
              mode="outlined"
              onPress={handleCopyUPI}
              style={{ borderRadius: 8, borderColor: theme.primaryColor }}
              textColor={theme.primaryColor}
            >
              Copy UPI ID
            </Button>
            <Button
              mode="text"
              onPress={() => setSettlementDialogVisible(false)}
              textColor={theme.primaryColor}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  expenseCard: {
    borderRadius: 12,
    elevation: 1,
    marginBottom: 8,
  },
  expenseContent: {
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseInfo: {
    marginLeft: 12,
    flex: 1,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAction: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e6f7e6',
    borderRadius: 8,
    marginBottom: 8,
  },
  settlementFlow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementArrow: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  settlementInfo: {
    marginLeft: 16,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export default GroupDetailsScreen;