import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Searchbar, 
  Chip, 
  Avatar,
  Divider,
  Menu,
  Button,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Checkbox,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppStore } from '../stores/useAppStore';
import { formatAmount, formatCurrency } from '../utils/upi';
import { Expense, RootStackParamList } from '../types';

type ExpensesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ExpensesScreen = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const { 
    theme, 
    currentUser, 
    expenses, 
    groups,
    markExpensePaid,
    clearAllExpenses,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'owe' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [amountRange, setAmountRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  
  // Selection and bulk operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  
  // Modals
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Get unique categories from groups
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(groups.map(g => g.purpose)));
    return ['all', ...uniqueCategories];
  }, [groups]);

  // Advanced filtering and sorting
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(expense => {
      // Search filter
      const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      const userParticipation = expense.participants.find(p => p.userId === currentUser?.id);
      const isPayer = expense.paidBy === currentUser?.id;
      const isParticipant = !!userParticipation;
      const hasPaid = userParticipation?.isPaid;
      const allOthersPaid = expense.participants.every(p => p.isPaid || p.userId === currentUser?.id);
      const someoneElseUnpaid = expense.participants.some(p => !p.isPaid && p.userId !== currentUser?.id);

      if (selectedFilter === 'all') {
        // Show all expenses involving the user
        if (!isPayer && !isParticipant) return false;
      } else if (selectedFilter === 'paid') {
        // Show only expenses where the user is a participant (not payer) and has paid
        if (!(isParticipant && hasPaid && !isPayer)) return false;
      } else if (selectedFilter === 'owe') {
        // Show only expenses where the user is a participant, not paid, and not the payer
        if (!(isParticipant && !hasPaid && !isPayer)) return false;
      } else if (selectedFilter === 'pending') {
        // Show expenses where the user is a participant and has not paid (not payer),
        // or is the payer and someone else is unpaid
        if (!((isParticipant && !hasPaid && !isPayer) || (isPayer && someoneElseUnpaid))) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const expenseDate = new Date(expense.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - expenseDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const group = groups.find(g => g.id === expense.groupId);
        if (group?.purpose !== categoryFilter) return false;
      }

      // Amount range filter
      if (amountRange !== 'all') {
        switch (amountRange) {
          case 'low':
            if (expense.totalAmount > 1000) return false;
            break;
          case 'medium':
            if (expense.totalAmount <= 1000 || expense.totalAmount > 5000) return false;
            break;
          case 'high':
            if (expense.totalAmount <= 5000) return false;
            break;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [expenses, searchQuery, selectedFilter, dateFilter, categoryFilter, amountRange, sortBy, sortOrder, currentUser, groups]);

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    const group = groups.find(g => g.members.some(m => m.id === userId));
    const user = group?.members.find(m => m.id === userId);
    return user?.name || 'Unknown User';
  };

  const getUserShare = (expense: Expense) => {
    const userParticipation = expense.participants.find(p => p.userId === currentUser?.id);
    return userParticipation?.amount || 0;
  };

  const getExpenseStatus = (expense: Expense) => {
    if (expense.paidBy === currentUser?.id) {
      const allPaid = expense.participants.every(p => p.isPaid || p.userId === currentUser.id);
      return allPaid ? 'settled' : 'pending_others';
    } else {
      const userParticipation = expense.participants.find(p => p.userId === currentUser?.id);
      return userParticipation?.isPaid ? 'paid' : 'unpaid';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return '#40c9a2';
      case 'paid': return '#40c9a2';
      case 'pending_others': return '#2f9c95';
      case 'unpaid': return '#a3f7b5';
      default: return theme.textColor;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'settled': return 'Settled';
      case 'paid': return 'Paid';
      case 'pending_others': return 'Pending';
      case 'unpaid': return 'You Owe';
      default: return 'Unknown';
    }
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

  const toggleExpenseSelection = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleBulkMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${selectedExpenses.size} expenses as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => {
            selectedExpenses.forEach(expenseId => {
              markExpensePaid(expenseId, currentUser!.id);
            });
            setSelectedExpenses(new Set());
            setIsSelectionMode(false);
            Alert.alert('Success', 'Expenses marked as paid!');
          }
        }
      ]
    );
  };

  const handleExportSelected = () => {
    Alert.alert(
      'Export Expenses',
      `Export ${selectedExpenses.size} selected expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Expenses exported successfully!');
            setSelectedExpenses(new Set());
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  const handleClearAllExpenses = () => {
    Alert.alert(
      'Clear All Expenses',
      'Are you sure you want to delete all expenses? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllExpenses();
            Alert.alert('Success', 'All expenses have been cleared!');
          }
        }
      ]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setDateFilter('all');
    setCategoryFilter('all');
    setAmountRange('all');
  };

  const hasActiveFilters = searchQuery || selectedFilter !== 'all' || dateFilter !== 'all' || 
                          categoryFilter !== 'all' || amountRange !== 'all';

  const getFilterChipStyle = (selected: boolean, theme: any) => ({
    borderRadius: 24,
    borderWidth: 1,
    borderColor: selected ? theme.primaryColor : theme.primaryColor + '40',
    backgroundColor: selected ? theme.primaryColor : 'transparent',
    elevation: 2,
    shadowColor: theme.primaryColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    minWidth: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];
  const currentDateLabel = dateRangeOptions.find(opt => opt.value === dateFilter)?.label || 'All Time';

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.backgroundColor,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="displaySmall" style={{ color: theme.textColor, fontWeight: '900', letterSpacing: -1.0 }}>
              All Expenses
            </Text>
            <View style={{ marginTop: 8 }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, alignSelf: 'flex-start', backgroundColor: theme.primaryColor + '20', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                <Text variant="bodyLarge" style={{ color: theme.primaryColor, fontWeight: '700', letterSpacing: 0.3 }}>
                  {filteredAndSortedExpenses.length} of {expenses.length} expenses
                </Text>
              </View>
            </View>
          </View>
          <View style={{ borderRadius: 20, backgroundColor: theme.primaryColor, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
            <IconButton
              icon="tune"
              size={24}
              iconColor={'white'}
              onPress={() => setShowFilterModal(true)}
              style={{ margin: 0 }}
            />
          </View>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={{ marginBottom: 8, marginTop: 16 }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Searchbar
            placeholder="Search expenses, descriptions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{
              borderRadius: 28,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              marginBottom: 4,
              backgroundColor: theme.surfaceColor,
              borderWidth: 2,
              borderColor: searchQuery ? theme.primaryColor + '40' : 'transparent',
            }}
            inputStyle={{ color: theme.textColor, fontSize: 16, fontWeight: '500' }}
            iconColor={theme.primaryColor}
            placeholderTextColor={theme.textColor + '80'}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 12, paddingTop: 4 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {['all', 'paid', 'owe', 'pending'].map(filter => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter as any)}
              style={{
                marginRight: 8,
                borderRadius: 24,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                paddingHorizontal: 4,
                backgroundColor: selectedFilter === filter ? theme.primaryColor : 'transparent',
                borderWidth: 2,
                borderColor: selectedFilter === filter ? theme.primaryColor : theme.primaryColor + '40',
              }}
              textStyle={{ color: selectedFilter === filter ? 'white' : theme.primaryColor, fontWeight: '700', letterSpacing: 0.3, textTransform: 'capitalize' }}
            >
              {filter === 'owe' ? 'You Owe' : filter}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <View style={styles.activeFilters}>
          <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>
            Filters active
          </Text>
          <Button 
            mode="text" 
            compact 
            onPress={clearAllFilters}
            labelStyle={{ color: theme.primaryColor }}
          >
            Clear All
          </Button>
        </View>
      )}

      {/* Expenses List */}
      <ScrollView style={{ flex: 1, paddingTop: 0, marginTop: 0 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {filteredAndSortedExpenses.length > 0 ? (
          filteredAndSortedExpenses.map((expense) => {
            const status = getExpenseStatus(expense);
            const userShare = getUserShare(expense);
            const group = groups.find(g => g.id === expense.groupId);
            const isSelected = selectedExpenses.has(expense.id);
            
            return (
              <TouchableOpacity
                key={expense.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (isSelectionMode) {
                    toggleExpenseSelection(expense.id);
                  } else {
                    navigation.navigate('ExpenseDetails', { expenseId: expense.id });
                  }
                }}
                onLongPress={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    setSelectedExpenses(new Set([expense.id]));
                  }
                }}
              >
                <View style={{ borderRadius: 16, backgroundColor: theme.surfaceColor, marginVertical: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, borderWidth: isSelected ? 2 : 0, borderColor: isSelected ? theme.primaryColor : 'transparent' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                    <Avatar.Icon size={36} icon="receipt" style={{ backgroundColor: theme.primaryColor }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '600' }}>{expense.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>{getGroupName(expense.groupId)}</Text>
                        {group && (
                          <Chip
                            mode="outlined"
                            compact
                            style={{ backgroundColor: 'transparent', borderColor: theme.primaryColor, marginLeft: 8 }}
                            textStyle={{ color: theme.primaryColor, fontSize: 10 }}
                          >
                            {group.purpose}
                          </Chip>
                        )}
                      </View>
                    </View>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(status), fontSize: 11, fontWeight: '600' }}
                      style={{ borderColor: getStatusColor(status), marginLeft: 8 }}
                      compact
                    >
                      {getStatusText(status)}
                    </Chip>
                  </View>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>Total Amount</Text>
                      <Text variant="titleMedium" style={{ color: theme.textColor, fontWeight: '600' }}>{formatCurrency(expense.totalAmount)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>Your Share</Text>
                      <Text variant="bodyLarge" style={{ color: expense.paidBy === currentUser?.id ? '#40c9a2' : '#2f9c95', fontWeight: '600' }}>{formatCurrency(userShare)}</Text>
                    </View>
                    {expense.description && (
                      <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.6, marginTop: 8, fontStyle: 'italic' }}>
                        "{expense.description}"
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person" size={16} color={theme.textColor} style={{ opacity: 0.7 }} />
                        <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7, marginLeft: 4 }}>
                          Paid by {getUserName(expense.paidBy)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar" size={14} color={theme.textColor} style={{ opacity: 0.7 }} />
                        <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7, marginLeft: 4 }}>
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {!isSelectionMode && status === 'unpaid' && (
                      <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                        <Button
                          mode="contained"
                          compact
                          onPress={() => {
                            markExpensePaid(expense.id, currentUser!.id);
                            Alert.alert('Success', 'Marked as paid!');
                          }}
                          style={{ backgroundColor: theme.primaryColor }}
                          labelStyle={{ color: 'white', fontSize: 12 }}
                        >
                          Mark as Paid
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color={theme.textColor} style={{ opacity: 0.3 }} />
            <Text variant="headlineSmall" style={{ color: theme.textColor, marginTop: 16, textAlign: 'center', fontWeight: '600' }}>
              {hasActiveFilters ? 'No Matching Expenses' : 'No Expenses Found'}
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.textColor, opacity: 0.7, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
              {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Start adding expenses to your groups!'}
            </Text>
            {hasActiveFilters && (
              <Button mode="outlined" onPress={clearAllFilters} style={{ marginTop: 16 }}>
                Clear Filters
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Selection Mode FAB */}
      {isSelectionMode && selectedExpenses.size > 0 && (
        <FAB
          icon="check"
          style={[styles.fab, { backgroundColor: theme.primaryColor }]}
          onPress={() => setShowBulkModal(true)}
          label={`Actions (${selectedExpenses.size})`}
        />
      )}

      {/* Multi-Select Mode Action Bar */}
      {isSelectionMode && (
        <View style={[styles.actionBar, { backgroundColor: theme.surfaceColor }]}>
          <Button
            mode="text"
            onPress={() => {
              const allIds = new Set(filteredAndSortedExpenses.map(e => e.id));
              setSelectedExpenses(allIds);
            }}
            labelStyle={{ color: theme.primaryColor }}
          >
            Select All
          </Button>
          <Button
            mode="text"
            onPress={() => setSelectedExpenses(new Set())}
            labelStyle={{ color: theme.primaryColor }}
          >
            Deselect All
          </Button>
        </View>
      )}

      {/* Sort Modal */}
      <Portal>
        <Modal 
          visible={showSortModal} 
          onDismiss={() => setShowSortModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.surfaceColor }]}
        >
          <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Sort Expenses
          </Text>
          
          <SegmentedButtons
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
            buttons={[
              { value: 'date', label: 'Date' },
              { value: 'amount', label: 'Amount' },
              { value: 'name', label: 'Name' },
            ]}
            style={{ marginBottom: 16 }}
          />
          
          <SegmentedButtons
            value={sortOrder}
            onValueChange={(value: any) => setSortOrder(value)}
            buttons={[
              { value: 'desc', label: 'Newest First' },
              { value: 'asc', label: 'Oldest First' },
            ]}
            style={{ marginBottom: 20 }}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowSortModal(false)}
              style={{ marginRight: 12 }}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={() => setShowSortModal(false)}
              style={{ backgroundColor: theme.primaryColor }}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Filter Modal */}
      <Portal>
        <Modal 
          visible={showFilterModal} 
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.surfaceColor }]}
        >
          <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Advanced Filters
          </Text>
          
          <Text variant="bodyLarge" style={{ color: theme.textColor, marginBottom: 8, fontWeight: '500' }}>
            Date Range
          </Text>
          <View style={{ marginBottom: 16 }}>
            <Menu
              visible={dateMenuVisible}
              onDismiss={() => setDateMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setDateMenuVisible(true)}
                  style={{ borderRadius: 24, borderColor: theme.primaryColor, backgroundColor: theme.surfaceColor }}
                  labelStyle={{ color: theme.textColor, fontWeight: '600' }}
                  contentStyle={{ flexDirection: 'row', justifyContent: 'flex-start' }}
                >
                  {currentDateLabel}
                </Button>
              }
              contentStyle={{ backgroundColor: theme.surfaceColor }}
            >
              {dateRangeOptions.map(opt => (
                <Menu.Item
                  key={opt.value}
                  onPress={() => {
                    setDateFilter(opt.value as typeof dateFilter);
                    setDateMenuVisible(false);
                  }}
                  title={opt.label}
                  titleStyle={{ color: theme.textColor, fontWeight: dateFilter === opt.value ? '700' : '400' }}
                  style={{ backgroundColor: dateFilter === opt.value ? theme.primaryColor + '20' : 'transparent' }}
                />
              ))}
            </Menu>
          </View>
          
          <Text variant="bodyLarge" style={{ color: theme.textColor, marginBottom: 8, fontWeight: '500' }}>
            Category
          </Text>
          <ScrollView horizontal={false} showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(category => (
              <Chip
                key={category}
                selected={categoryFilter === category}
                onPress={() => setCategoryFilter(category)}
                style={{ minWidth: 72, paddingHorizontal: 12, marginBottom: 8 }}
                textStyle={{ 
                  color: categoryFilter === category ? 'white' : theme.textColor,
                  textTransform: 'capitalize',
                  fontWeight: '600',
                }}
                selectedColor={theme.primaryColor}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>
          
          <Text variant="bodyLarge" style={{ color: theme.textColor, marginBottom: 8, fontWeight: '500' }}>
            Amount Range
          </Text>
          <SegmentedButtons
            value={amountRange}
            onValueChange={(value: any) => setAmountRange(value)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'low', label: '< ₹1K' },
              { value: 'medium', label: '₹1K-5K' },
              { value: 'high', label: '> ₹5K' },
            ]}
            style={{ marginBottom: 20 }}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={clearAllFilters}
              style={{ marginRight: 12 }}
            >
              Clear All
            </Button>
            <Button 
              mode="contained" 
              onPress={() => setShowFilterModal(false)}
              style={{ backgroundColor: theme.primaryColor }}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Bulk Actions Modal */}
      <Portal>
        <Modal 
          visible={showBulkModal} 
          onDismiss={() => setShowBulkModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.surfaceColor }]}
        >
          <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Bulk Actions
          </Text>
          
          <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, marginBottom: 20 }}>
            {selectedExpenses.size} expenses selected
          </Text>
          
          <Button
            mode="contained"
            onPress={() => {
              setShowBulkModal(false);
              handleBulkMarkPaid();
            }}
            style={{ backgroundColor: theme.primaryColor, marginBottom: 12 }}
          >
            Mark All as Paid
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {
              setShowBulkModal(false);
              handleExportSelected();
            }}
            style={{ marginBottom: 12 }}
          >
            Export Selected
          </Button>
          
          <Button
            mode="text"
            onPress={() => setShowBulkModal(false)}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 8,
    paddingBottom: 0,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 8,
    paddingBottom: 0,
    marginBottom: 0,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 0,
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 0,
    marginBottom: 0,
  },
  filterContainer: {
    paddingBottom: 0,
    backgroundColor: 'transparent',
    marginBottom: 0,
    height: 'auto',
    minHeight: 0,
  },
  filterContent: {
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 0,
    height: 'auto',
    minHeight: 0,
    paddingLeft: 8,
    paddingRight: 8,
  },
  content: {
    flex: 1,
    paddingTop: 0,
    marginTop: 0,
    minHeight: 0,
  },
  expenseCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  amountSection: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActions: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
    minWidth: 280,
    maxWidth: 400,
    width: '90%',
    paddingHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});

export default ExpensesScreen; 