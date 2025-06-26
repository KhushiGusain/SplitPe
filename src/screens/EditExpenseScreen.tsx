import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  Chip, 
  Avatar,
  IconButton,
  Divider,
  Switch,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/upi';

type EditExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type EditExpenseScreenRouteProp = RouteProp<RootStackParamList, 'EditExpense'>;

const EditExpenseScreen = () => {
  const navigation = useNavigation<EditExpenseScreenNavigationProp>();
  const route = useRoute<EditExpenseScreenRouteProp>();
  const { expenseId } = route.params;

  const { 
    theme, 
    currentUser, 
    groups,
    expenses,
    users,
    updateExpense,
    markExpensePaid,
    addUser,
    updateGroup,
    setLoading,
  } = useAppStore();

  // Get expense data
  const expense = expenses.find(e => e.id === expenseId);
  const group = expense ? groups.find(g => g.id === expense.groupId) : null;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<Array<{
    userId: string;
    amount: number;
    isPaid: boolean;
  }>>([]);
  const [isMarkingAllPaid, setIsMarkingAllPaid] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMarkAllSuccess, setShowMarkAllSuccess] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Load expense data
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setDescription(expense.description || '');
      setTotalAmount(expense.totalAmount.toString());
      setSplitType(expense.splitType === 'itemized' ? 'equal' : expense.splitType);
      setParticipants([...expense.participants]);
      setUpiTransactionId(expense.upiTransactionId || '');
    }
  }, [expense]);

  if (!expense || !group) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={60} color={theme.textColor} style={{ opacity: 0.3 }} />
          <Text variant="titleLarge" style={{ color: theme.textColor, textAlign: 'center', marginTop: 16 }}>
            Expense Not Found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }}>
            This expense may have been deleted
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

  const handleUpdateExpense = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an expense title');
      return;
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Force payer's isPaid to true
      const updatedParticipants = participants.map(p =>
        p.userId === expense.paidBy ? { ...p, isPaid: true } : p
      );
      // First, ensure all payment status changes are applied to the store
      updatedParticipants.forEach(participant => {
        if (participant.isPaid && participant.userId !== expense.paidBy) {
          // Check if this participant was not paid in the original expense
          const originalParticipant = expense.participants.find(p0 => p0.userId === participant.userId);
          if (originalParticipant && !originalParticipant.isPaid) {
            markExpensePaid(expenseId, participant.userId);
          }
        }
      });
      // Then update the expense with all changes
      updateExpense(expenseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        totalAmount: parseFloat(totalAmount),
        splitType,
        participants: updatedParticipants,
        upiTransactionId: upiTransactionId.trim() || undefined,
      });
      setHasUnsavedChanges(false);
      navigation.goBack();
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantAmountChange = (userId: string, newAmount: string) => {
    const amount = parseFloat(newAmount) || 0;
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, amount }
          : p
      )
    );
    setHasUnsavedChanges(true);
  };

  const getSplitTypeText = (type: string) => {
    switch (type) {
      case 'equal': return 'Split Equally';
      case 'custom': return 'Custom Split';
      default: return 'Split';
    }
  };

  // Helper for equal split calculation
  const calculateEqualSplitAmount = (currentParticipants: typeof participants) => {
    const total = parseFloat(totalAmount) || 0;
    const numParticipants = currentParticipants.length;
    return numParticipants > 0 ? parseFloat((total / numParticipants).toFixed(2)) : 0;
  };

  // Recalculate amounts when participants change
  const recalculateAmounts = (newParticipants: typeof participants) => {
    if (splitType === 'equal') {
      const equalAmount = calculateEqualSplitAmount(newParticipants);
      return newParticipants.map(p => ({ ...p, amount: equalAmount }));
    }
    return newParticipants;
  };

  // Add participant with proper recalculation
  const addParticipant = (memberId: string) => {
    const newParticipant = {
      userId: memberId,
      amount: 0,
      isPaid: false,
    };
    
    const newParticipants = [...participants, newParticipant];
    const recalculatedParticipants = recalculateAmounts(newParticipants);
    
    setParticipants(recalculatedParticipants);
    setHasUnsavedChanges(true);
  };

  // Remove participant with proper recalculation
  const removeParticipant = (memberId: string) => {
    const newParticipants = participants.filter(p => p.userId !== memberId);
    const recalculatedParticipants = recalculateAmounts(newParticipants);
    
    setParticipants(recalculatedParticipants);
    setHasUnsavedChanges(true);
  };

  // Handle split type change with recalculation
  const handleSplitTypeChange = (newSplitType: 'equal' | 'custom') => {
    setSplitType(newSplitType);
    if (newSplitType === 'equal') {
      const recalculatedParticipants = recalculateAmounts(participants);
      setParticipants(recalculatedParticipants);
    }
    setHasUnsavedChanges(true);
  };

  // Handle total amount change with recalculation
  const handleTotalAmountChange = (newAmount: string) => {
    setTotalAmount(newAmount);
    if (splitType === 'equal') {
      const recalculatedParticipants = recalculateAmounts(participants);
      setParticipants(recalculatedParticipants);
    }
    setHasUnsavedChanges(true);
  };

  // Helper for equal split (legacy function for backward compatibility)
  function getEqualSplitAmount() {
    return calculateEqualSplitAmount(participants);
  }

  // Add new member to group and expense
  const handleAddNewMember = () => {
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number');
      return;
    }

    // Check if user already exists
    const existingUser = users.find(u => u.phone === newMemberPhone.trim());
    if (existingUser) {
      Alert.alert('Error', 'A user with this phone number already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      email: `${newMemberName.toLowerCase().replace(' ', '')}@example.com`,
    };

    // Add user to system
    addUser(newUser);

    // Add user to group
    const updatedGroupMembers = [...group.members, newUser];
    updateGroup(group.id, { members: updatedGroupMembers });

    // Add user to expense participants with recalculated amounts
    const newParticipant = {
      userId: newUser.id,
      amount: 0,
      isPaid: false,
    };
    
    const newParticipants = [...participants, newParticipant];
    const recalculatedParticipants = recalculateAmounts(newParticipants);
    
    setParticipants(recalculatedParticipants);
    setHasUnsavedChanges(true);

    // Clear form
    setNewMemberName('');
    setNewMemberPhone('');

    Alert.alert('Success', `${newUser.name} has been added to the group and expense!`);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expense Details Card */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={{ color: theme.textColor, fontWeight: '600' }}>
                Edit Expense Details
              </Text>
              {hasUnsavedChanges && (
                <Chip
                  mode="flat"
                  style={{ backgroundColor: '#40c9a2', opacity: 0.8 }}
                  textStyle={{ color: 'white', fontSize: 12, fontWeight: '600' }}
                  icon="content-save"
                >
                  Unsaved
                </Chip>
              )}
            </View>
            
            <TextInput
              label="Expense Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Dinner at Restaurant"
              maxLength={100}
            />
            
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              placeholder="What was this expense for?"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            
            <TextInput
              label="Total Amount *"
              value={totalAmount}
              onChangeText={handleTotalAmountChange}
              mode="outlined"
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              left={<TextInput.Affix text="₹" />}
            />
            
            <TextInput
              label="UPI Transaction ID (Optional)"
              value={upiTransactionId}
              onChangeText={setUpiTransactionId}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. 1234567890@upi"
              maxLength={100}
            />
          </Card.Content>
        </Card>

        {/* Split Type Selection */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Split Method
            </Text>
            
            <View style={styles.splitTypeContainer}>
              <Chip
                selected={splitType === 'equal'}
                onPress={() => handleSplitTypeChange('equal')}
                style={[
                  styles.splitTypeChip,
                  {
                    backgroundColor: splitType === 'equal' ? theme.primaryColor : 'transparent',
                    borderColor: theme.primaryColor,
                    borderWidth: 1,
                  }
                ]}
                textStyle={{ 
                  color: splitType === 'equal' ? 'white' : theme.textColor 
                }}
                icon="equal"
              >
                Split Equally
              </Chip>
              
              <Chip
                selected={splitType === 'custom'}
                onPress={() => handleSplitTypeChange('custom')}
                style={[
                  styles.splitTypeChip,
                  {
                    backgroundColor: splitType === 'custom' ? theme.primaryColor : 'transparent',
                    borderColor: theme.primaryColor,
                    borderWidth: 1,
                  }
                ]}
                textStyle={{ 
                  color: splitType === 'custom' ? 'white' : theme.textColor 
                }}
                icon="account-edit"
              >
                Custom Split
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Participants */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Participants
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, marginBottom: 16 }}>
              Paid by: {getUserName(expense.paidBy)}
            </Text>

            {/* Add New Member */}
            <Text variant="bodyLarge" style={{ color: theme.textColor, marginTop: 16, marginBottom: 8, fontWeight: '500' }}>
              Add New Member
            </Text>
            <View style={styles.newMemberContainer}>
              <TextInput
                label="Name"
                value={newMemberName}
                onChangeText={setNewMemberName}
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 8 }]}
                placeholder="Enter name"
              />
              <TextInput
                label="Phone"
                value={newMemberPhone}
                onChangeText={setNewMemberPhone}
                mode="outlined"
                style={[styles.input, { flex: 1, marginLeft: 8, marginBottom: 8 }]}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
              />
            </View>
            <Button
              mode="outlined"
              onPress={handleAddNewMember}
              style={styles.addButton}
              icon="plus"
              disabled={!newMemberName.trim() || !newMemberPhone.trim()}
            >
              Add Member
            </Button>

            {/* Mark All as Paid Button - Only shows when there are unpaid participants (excluding the payer) */}
            {(() => {
              const hasUnpaidParticipants = participants.some(p => !p.isPaid && p.userId !== expense.paidBy);
              return hasUnpaidParticipants ? (
                <Button
                  mode={isMarkingAllPaid ? "contained" : "outlined"}
                  onPress={() => {
                    setIsMarkingAllPaid(true);
                    setParticipants(prev => 
                      prev.map(p => 
                        !p.isPaid && p.userId !== expense.paidBy
                          ? { ...p, isPaid: true }
                          : p
                      )
                    );
                    const updatedParticipants = participants.map(p => 
                      !p.isPaid && p.userId !== expense.paidBy
                        ? { ...p, isPaid: true }
                        : p
                    );
                    updatedParticipants.forEach(participant => {
                      if (participant.isPaid && participant.userId !== expense.paidBy) {
                        markExpensePaid(expenseId, participant.userId);
                      }
                    });
                    setTimeout(() => {
                      setIsMarkingAllPaid(false);
                      setHasUnsavedChanges(true);
                      setShowMarkAllSuccess(true);
                      setTimeout(() => {
                        setShowMarkAllSuccess(false);
                      }, 3000);
                    }, 500);
                  }}
                  style={{ 
                    marginBottom: 16, 
                    borderColor: theme.primaryColor,
                    backgroundColor: isMarkingAllPaid ? theme.primaryColor : 'transparent'
                  }}
                  textColor={isMarkingAllPaid ? 'white' : theme.primaryColor}
                  icon={isMarkingAllPaid ? "check-circle" : "check-all"}
                  loading={isMarkingAllPaid}
                  disabled={isMarkingAllPaid}
                >
                  {isMarkingAllPaid ? 'Marking All as Paid...' : 'Mark All as Paid'}
                </Button>
              ) : (
                <View style={[styles.successContainer, { backgroundColor: '#40c9a2', opacity: 0.1 }]}> 
                  <Text variant="bodyMedium" style={{ color: '#40c9a2', textAlign: 'center', fontWeight: '600' }}>
                    ✓ All payments completed!
                  </Text>
                </View>
              );
            })()}
            {showMarkAllSuccess && (
              <View style={[styles.successContainer, { backgroundColor: '#40c9a2', opacity: 0.9 }]}> 
                <Text variant="bodyMedium" style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                  ✓ All payments marked as paid successfully!
                </Text>
              </View>
            )}
            {/* Show all group members, with add/remove logic */}
            {group.members.map((member) => {
              const participant = participants.find(p => p.userId === member.id);
              const isPayer = member.id === expense.paidBy;
              if (participant) {
                return (
                  <View key={member.id} style={styles.participantItem}>
                    <View style={styles.participantLeft}>
                      <Avatar.Text
                        size={40}
                        label={member.name.charAt(0).toUpperCase()}
                        style={{ backgroundColor: theme.primaryColor }}
                        labelStyle={{ color: 'white' }}
                      />
                      <View style={styles.participantInfo}>
                        <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '500' }}>
                          {getUserName(member.id)}
                          {isPayer && (
                            <Text style={{ color: theme.primaryColor, fontSize: 12 }}> (Payer)</Text>
                          )}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>
                          Share: {formatCurrency(participant.amount)}
                        </Text>
                      </View>
                    </View>
                    {isPayer && (
                      <Text style={{ color: '#40c9a2', fontWeight: '600', marginRight: 4 }}>
                        Paid
                      </Text>
                    )}
                    {!isPayer && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: participant.isPaid ? '#40c9a2' : theme.textColor, fontWeight: '600', marginRight: 4 }}>
                          {participant.isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                        <Switch
                          value={participant.isPaid}
                          onValueChange={(value) => {
                            setParticipants(prev => prev.map(p =>
                              p.userId === participant.userId ? { ...p, isPaid: value } : p
                            ));
                            setHasUnsavedChanges(true);
                          }}
                          color={theme.primaryColor}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeParticipant(member.id)}
                          style={{ marginLeft: 4 }}
                          iconColor="#e74c3c"
                          accessibilityLabel={`Remove ${member.name}`}
                        />
                      </View>
                    )}
                  </View>
                );
              } else {
                return (
                  <View key={member.id} style={styles.participantItem}>
                    <View style={styles.participantLeft}>
                      <Avatar.Text
                        size={40}
                        label={member.name.charAt(0).toUpperCase()}
                        style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
                        labelStyle={{ color: 'white' }}
                      />
                      <View style={styles.participantInfo}>
                        <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '500', opacity: 0.5 }}>
                          {getUserName(member.id)}
                        </Text>
                      </View>
                    </View>
                    <IconButton
                      icon="plus"
                      size={24}
                      onPress={() => addParticipant(member.id)}
                      style={{ marginLeft: 4 }}
                      iconColor={theme.primaryColor}
                      accessibilityLabel={`Add ${member.name}`}
                    />
                  </View>
                );
              }
            })}
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.backgroundColor }]}>
        <Button
          mode="contained"
          onPress={handleUpdateExpense}
          style={[
            styles.updateButton, 
            { 
              backgroundColor: hasUnsavedChanges ? '#40c9a2' : theme.primaryColor,
              borderColor: hasUnsavedChanges ? '#40c9a2' : theme.primaryColor,
            }
          ]}
          contentStyle={styles.updateButtonContent}
          labelStyle={{ color: 'white', fontSize: 16, fontWeight: '600' }}
          disabled={!title.trim() || !totalAmount || parseFloat(totalAmount) <= 0}
          icon={hasUnsavedChanges ? "content-save" : "check"}
        >
          {hasUnsavedChanges ? 'Save Changes' : 'Update Expense'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  splitTypeChip: {
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  amountInput: {
    width: 120,
  },
  bottomContainer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  updateButton: {
    borderRadius: 12,
  },
  updateButtonContent: {
    paddingVertical: 8,
  },
  successContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  newMemberContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
});

export default EditExpenseScreen; 