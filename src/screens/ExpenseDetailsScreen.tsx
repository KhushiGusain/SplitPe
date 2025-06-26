import React, { useState, useLayoutEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Chip, 
  Button, 
  IconButton,
  Divider,
  FAB,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/upi';

const { width } = Dimensions.get('window');

type ExpenseDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ExpenseDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ExpenseDetails'>;

const ExpenseDetailsScreen = () => {
  const navigation = useNavigation<ExpenseDetailsScreenNavigationProp>();
  const route = useRoute<ExpenseDetailsScreenRouteProp>();
  const { expenseId } = route.params;

  const { 
    theme, 
    currentUser, 
    groups,
    expenses,
    markExpensePaid,
    deleteExpense,
  } = useAppStore();

  const [showReceipt, setShowReceipt] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get expense data
  const expense = expenses.find(e => e.id === expenseId);
  const group = expense ? groups.find(g => g.id === expense.groupId) : null;

  const handleEdit = useCallback(() => {
    if (!expense) return;
    
    navigation.navigate('EditExpense', { expenseId });
  }, [expense, expenseId, navigation]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, [setShowDeleteDialog]);

  const confirmDelete = useCallback(() => {
    setShowDeleteDialog(false);
    if (!expense) return;
    deleteExpense(expenseId);
    navigation.goBack();
    setTimeout(() => {
      Alert.alert('Success', 'Expense deleted successfully!');
    }, 300);
  }, [expense, expenseId, deleteExpense, navigation]);

  // Set header options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: expense?.title || 'Expense Details',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="pencil"
            size={22}
            iconColor={theme.textColor}
            onPress={handleEdit}
          />
          <IconButton
            icon="delete"
            size={22}
            iconColor="#ef4444"
            onPress={handleDelete}
          />
        </View>
      ),
    });
  }, [navigation, expense, theme, handleEdit, handleDelete]);

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

  const getPaymentStatus = (userId: string) => {
    if (userId === expense.paidBy) return 'paid';
    const participant = expense.participants.find(p => p.userId === userId);
    return participant?.isPaid ? 'paid' : 'pending';
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return '#40c9a2';
      case 'pending': return '#2f9c95';
      default: return theme.textColor;
    }
  };

  const handleMarkPaid = (participantId: string) => {
    markExpensePaid(expenseId, participantId);
  };

  const handleRequestPayment = (participantId: string) => {
    const participant = expense.participants.find(p => p.userId === participantId);
    if (!participant) return;

    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`Payment reminder sent to ${getUserName(participantId)}.`);
    } else {
      Alert.alert(
        'Notification Sent',
        `Payment reminder sent to ${getUserName(participantId)}.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getSplitTypeText = (splitType: string) => {
    switch (splitType) {
      case 'equal': return 'Split Equally';
      case 'custom': return 'Custom Split';
      case 'itemized': return 'Itemized Split';
      default: return 'Split';
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

  const totalPaid = expense.participants.filter(p => p.isPaid || p.userId === expense.paidBy).length;
  const totalParticipants = expense.participants.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expense Header */}
        <Card style={[styles.headerCard, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <View style={styles.headerTop}>
              <Avatar.Icon
                size={60}
                icon="receipt"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <View style={styles.headerInfo}>
                <Text variant="headlineSmall" style={{ color: theme.textColor, fontWeight: '700' }}>
                  {expense.title}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.textColor, opacity: 0.7 }}>
                  {group.name}
                </Text>
                <View style={styles.headerMeta}>
                  <Chip
                    mode="outlined"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: getPurposeColor(group.purpose),
                    }}
                    textStyle={{ color: getPurposeColor(group.purpose), fontSize: 12 }}
                  >
                    {group.purpose}
                  </Chip>
                  <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.6 }}>
                    {new Date(expense.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={{ marginVertical: 16, backgroundColor: theme.textColor, opacity: 0.1 }} />

            <View style={styles.amountSection}>
              <Text variant="headlineLarge" style={{ color: theme.textColor, fontWeight: '700', textAlign: 'center' }}>
                {formatCurrency(expense.totalAmount)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7, textAlign: 'center' }}>
                Paid by {getUserName(expense.paidBy)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.6, textAlign: 'center' }}>
                {getSplitTypeText(expense.splitType)}
              </Text>
            </View>

            {expense.description && (
              <>
                <Divider style={{ marginVertical: 16, backgroundColor: theme.textColor, opacity: 0.1 }} />
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.8 }}>
                  "{expense.description}"
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Payment Progress */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium" style={{ color: theme.textColor, fontWeight: '600' }}>
                Payment Progress
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                {totalPaid}/{totalParticipants} paid
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(totalPaid / totalParticipants) * 100}%`,
                    backgroundColor: theme.primaryColor,
                  }
                ]}
              />
            </View>
            
            <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.6, textAlign: 'center', marginTop: 8 }}>
              {totalPaid === totalParticipants ? 'All payments complete!' : `${totalParticipants - totalPaid} payments pending`}
            </Text>
          </Card.Content>
        </Card>

        {/* Participants */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Participants
            </Text>
            
            {expense.participants.map((participant) => {
              const user = group.members.find(m => m.id === participant.userId);
              const status = getPaymentStatus(participant.userId);
              const isPayer = participant.userId === expense.paidBy;
              
              return (
                <View key={participant.userId} style={styles.participantItem}>
                  <View style={styles.participantLeft}>
                    <Avatar.Text
                      size={40}
                      label={user?.name.charAt(0).toUpperCase() || '?'}
                      style={{ backgroundColor: theme.primaryColor }}
                      labelStyle={{ color: 'white' }}
                    />
                    <View style={styles.participantInfo}>
                      <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '500' }}>
                        {getUserName(participant.userId)}
                        {isPayer && (
                          <Text style={{ color: theme.primaryColor, fontSize: 12 }}> (Payer)</Text>
                        )}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>
                        Share: {formatCurrency(participant.amount)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.participantRight}>
                    <Chip
                      mode={status === 'paid' ? 'flat' : 'outlined'}
                      style={{ 
                        backgroundColor: status === 'paid' ? '#40c9a2' : 'transparent',
                        borderColor: getPaymentColor(status),
                      }}
                      textStyle={{ 
                        color: status === 'paid' ? 'white' : getPaymentColor(status),
                        fontSize: 12,
                        fontWeight: '600'
                      }}
                    >
                      {status === 'paid' ? '✓ Paid' : 'Pending'}
                    </Chip>
                    
                    {status === 'pending' && participant.userId !== currentUser?.id && (
                      <View style={styles.participantActions}>
                        <IconButton
                          icon="check"
                          size={20}
                          iconColor="#40c9a2"
                          style={{ margin: 0 }}
                          onPress={() => handleMarkPaid(participant.userId)}
                        />
                        <IconButton
                          icon="bell"
                          size={20}
                          iconColor="#2f9c95"
                          style={{ margin: 0 }}
                          onPress={() => handleRequestPayment(participant.userId)}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Transaction Details */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Transaction Details
            </Text>
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                Expense ID
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, fontFamily: 'monospace' }}>
                {expense.id.slice(0, 8)}...
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                Split Method
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor }}>
                {getSplitTypeText(expense.splitType)}
              </Text>
            </View>
            
            {expense.upiTransactionId && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                  UPI Transaction ID
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.textColor, fontFamily: 'monospace' }}>
                  {expense.upiTransactionId}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                Created On
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor }}>
                {new Date(expense.createdAt).toLocaleString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Receipt */}
        {expense.receiptImage && (
          <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
                Receipt
              </Text>
              
              <TouchableOpacity 
                style={styles.receiptContainer}
                onPress={() => setShowReceipt(true)}
              >
                <Image 
                  source={{ uri: expense.receiptImage }}
                  style={styles.receiptThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.receiptOverlay}>
                  <Ionicons name="eye" size={24} color="white" />
                  <Text variant="bodySmall" style={{ color: 'white', marginTop: 4 }}>
                    Tap to view
                  </Text>
                </View>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Receipt Modal */}
      {showReceipt && expense.receiptImage && (
        <View style={styles.receiptModal}>
          <TouchableOpacity 
            style={styles.receiptModalOverlay}
            onPress={() => setShowReceipt(false)}
          >
            <View style={styles.receiptModalContent}>
              <Image 
                source={{ uri: expense.receiptImage }}
                style={styles.receiptFullImage}
                resizeMode="contain"
              />
              <IconButton
                icon="close"
                size={30}
                iconColor="white"
                style={styles.closeButton}
                onPress={() => setShowReceipt(false)}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: theme.primaryColor, fontWeight: 'bold', textAlign: 'center' }}>Delete Expense?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.textColor, textAlign: 'center', marginBottom: 8 }}>
              Are you sure you want to delete "{expense?.title}"?
            </Text>
            <Text style={{ color: theme.textColor, textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
              This will <Text style={{ color: theme.primaryColor, fontWeight: 'bold' }}>remove this expense</Text> from the group and cannot be undone.
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
              onPress={confirmDelete}
              style={{ backgroundColor: theme.primaryColor, borderRadius: 8 }}
              textColor="white"
            >
              Delete
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
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
  participantRight: {
    alignItems: 'flex-end',
  },
  participantActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  receiptContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
  },
  receiptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModalContent: {
    width: width - 32,
    height: '80%',
    position: 'relative',
  },
  receiptFullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default ExpenseDetailsScreen; 