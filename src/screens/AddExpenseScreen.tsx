import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Chip, 
  Card,
  Avatar,
  IconButton,
  SegmentedButtons,
  Switch,
  Divider,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList, User, ExpenseParticipant } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { calculateEqualSplit, calculateCustomSplit, validateExpenseParticipants } from '../utils/calculations';
import { formatAmount, formatCurrency } from '../utils/upi';

type AddExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

const AddExpenseScreen = () => {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const { groupId } = route.params;

  const { 
    currentUser, 
    groups,
    users,
    theme, 
    addExpense,
    setLoading,
  } = useAppStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'itemized'>('equal');
  const [participants, setParticipants] = useState<ExpenseParticipant[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({});
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Get group and members
  const group = groups.find(g => g.id === groupId);
  const groupMembers = group?.members || [];

  // Initialize with all group members selected
  useEffect(() => {
    if (groupMembers.length > 0) {
      setSelectedMembers(groupMembers.map(m => m.id));
    }
  }, [groupMembers]);

  // Calculate split whenever dependencies change
  useEffect(() => {
    calculateSplit();
  }, [amount, selectedMembers, splitType, customAmounts]);

  const calculateSplit = () => {
    const totalAmount = parseFloat(amount) || 0;
    if (totalAmount <= 0 || selectedMembers.length === 0) {
      setParticipants([]);
      return;
    }

    try {
      let newParticipants: ExpenseParticipant[] = [];

      if (splitType === 'equal') {
        newParticipants = calculateEqualSplit(totalAmount, selectedMembers);
      } else if (splitType === 'custom') {
        const customSplit = selectedMembers.map(userId => ({
          userId,
          amount: parseFloat(customAmounts[userId] || '0'),
        }));
        newParticipants = calculateCustomSplit(totalAmount, customSplit);
      }

      setParticipants(newParticipants);
    } catch (error) {
      console.log('Split calculation error:', error);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload receipts');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSaveExpense = async () => {
    // General check for all required fields
    if (!title.trim() || !amount || parseFloat(amount) <= 0 || selectedMembers.length === 0 || !paidBy) {
      setErrorMessage('All fields must be filled.');
      setErrorDialogVisible(true);
      return;
    }

    const totalAmount = parseFloat(amount);

    // Validate participants
    const validation = validateExpenseParticipants(totalAmount, participants);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid participant configuration');
      setErrorDialogVisible(true);
      return;
    }

    setLoading(true);

    try {
      await addExpense({
        groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        totalAmount,
        paidBy,
        splitType,
        participants,
        upiTransactionId: upiTransactionId.trim() || undefined,
        receiptImage: receiptImage || undefined,
        currency: 'INR',
      });

      navigation.navigate('GroupDetails', { groupId });
      Alert.alert('Success!', 'Expense added successfully');
    } catch (error) {
      setErrorMessage('Failed to add expense. Please try again.');
      setErrorDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    const user = groupMembers.find(m => m.id === userId);
    return user?.name || 'Unknown';
  };

  const totalCustomAmount = Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const remainingAmount = (parseFloat(amount) || 0) - totalCustomAmount;

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Avatar.Icon
                size={56}
                icon="receipt"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
              />
              <View style={styles.headerInfo}>
                <Text variant="headlineSmall" style={{ 
                  color: theme.textColor, 
                  fontWeight: '800',
                  letterSpacing: -0.5,
                  marginBottom: 2,
                }}>
                  Add Expense
                </Text>
                <Text variant="titleMedium" style={{ 
                  color: theme.textColor, 
                  opacity: 0.7,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }}>
                  {group.name}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Basic Details */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ 
              color: theme.textColor, 
              marginBottom: 20, 
              fontWeight: '700',
              letterSpacing: -0.3,
            }}>
              Expense Details
            </Text>
            
            <TextInput
              label="Expense Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Dinner at restaurant"
              maxLength={100}
            />
            
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              placeholder="Additional details..."
              multiline
              numberOfLines={2}
              maxLength={500}
            />

            <TextInput
              label="Amount (₹) *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
            />
          </Card.Content>
        </Card>

        {/* Who Paid */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Who Paid?
            </Text>
            
            <View style={styles.membersList}>
              {groupMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberItem,
                    paidBy === member.id && { backgroundColor: theme.primaryColor + '15' }
                  ]}
                  onPress={() => setPaidBy(member.id)}
                >
                  <Avatar.Text
                    size={36}
                    label={member.name.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.primaryColor }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.textColor, marginLeft: 12, flex: 1 }}>
                    {member.id === currentUser?.id ? 'You' : member.name}
                  </Text>
                  {paidBy === member.id && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primaryColor} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Split Type */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              How to Split?
            </Text>
            
            <SegmentedButtons
              value={splitType}
              onValueChange={(value: any) => setSplitType(value)}
              buttons={[
                { value: 'equal', label: 'Equal' },
                { value: 'custom', label: 'Custom' },
                { value: 'itemized', label: 'Items', disabled: true },
              ]}
              style={styles.segmentedButtons}
            />

            {splitType === 'custom' && (
              <View style={styles.customSplitInfo}>
                <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center' }}>
                  Enter custom amounts for each participant
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Participants */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Split Between ({participants.length} people)
            </Text>
            {groupMembers.map((member) => {
              const participant = participants.find(p => p.userId === member.id);
              const isPayer = member.id === paidBy;
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
                          }}
                          color={theme.primaryColor}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => setParticipants(prev => prev.filter(p => p.userId !== member.id))}
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
                      onPress={() => setParticipants(prev => [...prev, { userId: member.id, amount: 0, isPaid: false }])}
                      style={{ marginLeft: 4 }}
                      iconColor={theme.primaryColor}
                      accessibilityLabel={`Add ${member.name}`}
                    />
                  </View>
                );
              }
            })}

            {splitType === 'custom' && selectedMembers.length > 0 && (
              <View style={styles.totalSummary}>
                <Divider style={{ marginVertical: 12 }} />
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium" style={{ color: theme.textColor }}>
                    Total: {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.textColor }}>
                    Split: {formatCurrency(totalCustomAmount)}
                  </Text>
                </View>
                {Math.abs(remainingAmount) > 0.01 && (
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: remainingAmount > 0 ? '#2f9c95' : theme.textColor,
                      textAlign: 'center',
                      marginTop: 4
                    }}
                  >
                    {remainingAmount > 0 
                      ? `₹${remainingAmount.toFixed(2)} remaining`
                      : `₹${Math.abs(remainingAmount).toFixed(2)} over`
                    }
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* UPI & Receipt */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Additional Details
            </Text>
            
            <TextInput
              label="UPI Transaction ID (Optional)"
              value={upiTransactionId}
              onChangeText={setUpiTransactionId}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 123456789"
              left={<TextInput.Icon icon="bank" />}
            />

            <View style={styles.receiptSection}>
              <Text variant="bodyMedium" style={{ color: theme.textColor, marginBottom: 8 }}>
                Receipt Photo (Optional)
              </Text>
              
              {receiptImage ? (
                <View style={styles.receiptPreview}>
                  <Text variant="bodySmall" style={{ color: theme.primaryColor }}>
                    ✓ Receipt attached
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => setReceiptImage(null)}
                  />
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handlePickImage}
                  icon="camera"
                  style={styles.receiptButton}
                >
                  Add Receipt
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.backgroundColor }]}>
        <Button
          mode="contained"
          onPress={handleSaveExpense}
          style={[styles.saveButton, { backgroundColor: theme.primaryColor }]}
          contentStyle={styles.saveButtonContent}
          labelStyle={{ color: 'white', fontSize: 16, fontWeight: '600' }}
        >
          Add Expense • {formatCurrency(parseFloat(amount) || 0)}
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={errorDialogVisible}
          onDismiss={() => setErrorDialogVisible(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>Validation Error</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.textColor, textAlign: 'center', marginBottom: 8 }}>
              {errorMessage}
            </Text>
            <Text style={{ color: theme.textColor, textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
              Please fix the error and try again.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Button
              mode="contained"
              onPress={() => setErrorDialogVisible(false)}
              style={{ backgroundColor: theme.primaryColor, borderRadius: 8 }}
              textColor="white"
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  card: {
    margin: 20,
    marginBottom: 16,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(163, 247, 181, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  input: {
    marginBottom: 20,
    borderRadius: 16,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  customSplitInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(163, 247, 181, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 162, 0.2)',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginVertical: 2,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantInfo: {
    flexDirection: 'column',
    marginLeft: 12,
  },
  totalSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(64, 201, 162, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 162, 0.3)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptSection: {
    marginTop: 12,
  },
  receiptPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(163, 247, 181, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 162, 0.4)',
  },
  receiptButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(64, 201, 162, 0.3)',
  },
  bottomContainer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgba(163, 247, 181, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  saveButton: {
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  saveButtonContent: {
    paddingVertical: 12,
  },
});

export default AddExpenseScreen; 