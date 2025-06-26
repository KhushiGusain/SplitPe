import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  FAB, 
  Searchbar, 
  Chip,
  Banner,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { useAppStore } from '../stores/useAppStore';
import GroupCard from '../components/GroupCard';
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
import { ResponsiveContainer, ResponsiveText, ResponsiveEmptyState } from '../utils/responsiveComponents';

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const GroupsScreen = () => {
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const { 
    groups, 
    theme, 
    currentUser,
    createGroup,
    addUser,
    addExpense,
    expenses,
    getGroupExpenses,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Sample data setup
  useEffect(() => {
    if (groups.length === 0 && currentUser) {
      setupSampleData();
      setShowWelcome(true);
    }
  }, [currentUser]);

  // Dummy data setup for 2 groups and 4 expenses
  const setupSampleData = () => {
    if (!currentUser) return;

    // Create sample users
    const sampleUsers = [
      {
        id: 'user_2',
        name: 'Rahul Kumar',
        phone: '+91 98765 43211',
        email: 'rahul@example.com',
        upiId: 'rahul@phonepe',
      },
      {
        id: 'user_3',
        name: 'Priya Sharma',
        phone: '+91 98765 43212',
        email: 'priya@example.com',
        upiId: 'priya@gpay',
      },
    ];

    sampleUsers.forEach(user => addUser(user));

    // Create 2 sample groups
    const sampleGroups = [
      {
        name: 'Goa Trip',
        description: 'Trip to Goa with friends',
        purpose: 'Trip' as const,
        members: [currentUser, sampleUsers[0], sampleUsers[1]],
        createdBy: currentUser.id,
        totalExpenses: 0,
        currency: 'INR',
        isActive: true,
      },
      {
        name: 'Flat Rent',
        description: 'Monthly rent and utilities',
        purpose: 'Rent' as const,
        members: [currentUser, sampleUsers[0]],
        createdBy: currentUser.id,
        totalExpenses: 0,
        currency: 'INR',
        isActive: true,
      },
    ];

    sampleGroups.forEach(group => createGroup(group));

    // Add 4 sample expenses (2 per group)
    setTimeout(() => {
      const createdGroups = groups.slice(-2); // Get the last 2 created groups
      // Goa Trip expenses
      addExpense({
        groupId: createdGroups[0]?.id || groups[0]?.id || '1',
        title: 'Hotel',
        description: 'Hotel stay',
        totalAmount: 6000,
        paidBy: currentUser.id,
        splitType: 'equal',
        participants: [
          { userId: currentUser.id, amount: 2000, isPaid: true },
          { userId: sampleUsers[0].id, amount: 2000, isPaid: false },
          { userId: sampleUsers[1].id, amount: 2000, isPaid: false },
        ],
        currency: 'INR',
      });
      addExpense({
        groupId: createdGroups[0]?.id || groups[0]?.id || '1',
        title: 'Dinner',
        description: 'Dinner at beach shack',
        totalAmount: 3000,
        paidBy: sampleUsers[0].id,
        splitType: 'equal',
        participants: [
          { userId: currentUser.id, amount: 1000, isPaid: false },
          { userId: sampleUsers[0].id, amount: 1000, isPaid: true },
          { userId: sampleUsers[1].id, amount: 1000, isPaid: false },
        ],
        currency: 'INR',
      });
      // Flat Rent expenses
      addExpense({
        groupId: createdGroups[1]?.id || groups[1]?.id || '2',
        title: 'January Rent',
        description: 'Rent for January',
        totalAmount: 10000,
        paidBy: currentUser.id,
        splitType: 'equal',
        participants: [
          { userId: currentUser.id, amount: 5000, isPaid: true },
          { userId: sampleUsers[0].id, amount: 5000, isPaid: false },
        ],
        currency: 'INR',
      });
      addExpense({
        groupId: createdGroups[1]?.id || groups[1]?.id || '2',
        title: 'Electricity Bill',
        description: 'Monthly electricity',
        totalAmount: 2000,
        paidBy: sampleUsers[0].id,
        splitType: 'equal',
        participants: [
          { userId: currentUser.id, amount: 1000, isPaid: false },
          { userId: sampleUsers[0].id, amount: 1000, isPaid: true },
        ],
        currency: 'INR',
      });
    }, 100);
  };

  const purposes = ['Trip', 'Rent', 'Party', 'Office Snacks', 'Dining', 'Others'];

  // Helper to check if a group has any pending expenses
  const hasPendingExpenses = (groupId: string) => {
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    if (groupExpenses.length === 0) return true; // New group, show as pending
    return groupExpenses.some(expense =>
      expense.participants.some(p => !p.isPaid && p.userId !== expense.paidBy)
    );
  };

  // Helper to get group status
  const getGroupStatus = (groupId: string) => {
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    if (groupExpenses.length === 0) return 'Pending';
    const allPaid = groupExpenses.every(expense =>
      expense.participants.every(p => p.isPaid || p.userId === expense.paidBy)
    );
    return allPaid ? 'Completed' : 'Pending';
  };

  // Filter groups: only show those with pending expenses
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPurpose = !selectedPurpose || group.purpose === selectedPurpose;
    return matchesSearch && matchesPurpose && hasPendingExpenses(group.id);
  });

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  // Responsive icon sizes
  const emptyStateIconSize = getResponsiveValue({
    small: 60,
    medium: 70,
    large: 80,
    xlarge: 90,
  });

  const searchIconSize = getResponsiveValue({
    small: 18,
    medium: 20,
    large: 22,
    xlarge: 24,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Welcome Banner */}
      {showWelcome && (
        <Banner
          visible={showWelcome}
          actions={[
            {
              label: 'Got it',
              onPress: () => setShowWelcome(false),
            },
          ]}
          icon={({ size }) => (
            <Ionicons name="hand-right" size={moderateScale(size)} color={theme.primaryColor} />
          )}
          style={{ backgroundColor: theme.surfaceColor, marginBottom: spacing.xs }}
        >
          <ResponsiveText size="base" color={theme.textColor}>
            Welcome to SplitPe! Track your UPI expenses and split bills with friends seamlessly.
          </ResponsiveText>
        </Banner>
      )}

      {/* Modern Header */}
      <View style={[styles.header, { 
        backgroundColor: `linear-gradient(135deg, ${theme.surfaceColor}, ${theme.backgroundColor})` 
      }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text variant="displaySmall" style={{ 
              color: theme.textColor, 
              fontWeight: '900',
              letterSpacing: -1.0,
              marginBottom: 4,
            }}>
              Your Groups
            </Text>
            {filteredGroups.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={[styles.statsBadge, { backgroundColor: theme.primaryColor + '20' }]}>
                  <ResponsiveText size="base" color={theme.primaryColor} weight="700">
                    {filteredGroups.length} active groups
                  </ResponsiveText>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Search & Filters */}
      {groups.length > 0 && (
        <View style={styles.filtersSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search groups..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchbar, { 
                backgroundColor: theme.surfaceColor,
                borderWidth: 2,
                borderColor: searchQuery ? theme.primaryColor + '40' : 'transparent',
              }]}
              inputStyle={{ 
                color: theme.textColor,
                fontSize: fontSize.base,
                fontWeight: '500',
              }}
              iconColor={theme.primaryColor}
              placeholderTextColor={theme.textColor + '80'}
            />
          </View>

          {/* Purpose Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterScrollView} 
            contentContainerStyle={styles.filterContentContainer}
          >
            <Chip
              selected={!selectedPurpose}
              onPress={() => setSelectedPurpose(null)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: !selectedPurpose ? theme.primaryColor : 'transparent',
                  borderColor: !selectedPurpose ? theme.primaryColor : theme.primaryColor + '40',
                }
              ]}
              textStyle={{ 
                color: !selectedPurpose ? 'white' : theme.primaryColor, 
                fontWeight: '700', 
                letterSpacing: 0.3,
                fontSize: fontSize.sm,
              }}
            >
              All
            </Chip>
            {purposes.map(purpose => (
              <Chip
                key={purpose}
                selected={selectedPurpose === purpose}
                onPress={() => setSelectedPurpose(selectedPurpose === purpose ? null : purpose)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedPurpose === purpose ? theme.primaryColor : 'transparent',
                    borderColor: selectedPurpose === purpose ? theme.primaryColor : theme.primaryColor + '40',
                  }
                ]}
                textStyle={{ 
                  color: selectedPurpose === purpose ? 'white' : theme.primaryColor, 
                  fontWeight: '700', 
                  letterSpacing: 0.3,
                  fontSize: fontSize.sm,
                }}
              >
                {purpose}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Groups List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {filteredGroups.length > 0 ? (
          <>
            {filteredGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                status={getGroupStatus(group.id)}
                onPress={() => handleGroupPress(group.id)}
              />
            ))}
            {/* Bottom spacing for FAB */}
            <View style={styles.bottomSpacing} />
          </>
        ) : groups.length === 0 ? (
          <ResponsiveEmptyState
            icon={
              <Ionicons 
                name="people-outline" 
                size={emptyStateIconSize} 
                color={theme.textColor} 
                style={{ opacity: 0.3 }} 
              />
            }
            title="No Groups Yet"
            subtitle="Create your first group to start splitting expenses with friends!"
          />
        ) : (
          <ResponsiveEmptyState
            icon={
              <Ionicons 
                name="search-outline" 
                size={emptyStateIconSize * 0.75} 
                color={theme.textColor} 
                style={{ opacity: 0.3 }} 
              />
            }
            title="No groups found"
            subtitle="Try adjusting your search or filter"
          />
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.primaryColor }
        ]}
        onPress={handleCreateGroup}
        label="New Group"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: padding.lg,
    paddingTop: padding.md,
    paddingBottom: padding.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  statsContainer: {
    marginTop: spacing.sm,
  },
  statsBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filtersSection: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: padding.lg,
    paddingVertical: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: spacing.xs,
  },
  filterScrollView: {
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  filterContentContainer: {
    paddingHorizontal: padding.lg,
    gap: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingHorizontal: spacing.xs,
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  bottomSpacing: {
    height: moderateScale(100),
  },
  fab: {
    position: 'absolute',
    bottom: moderateScale(32),
    right: moderateScale(24),
    borderRadius: moderateScale(32),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    transform: [{ scale: 1.1 }],
  },
});

export default GroupsScreen; 