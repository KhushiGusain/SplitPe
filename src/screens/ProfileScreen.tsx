import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  List, 
  Switch, 
  Divider,
  Button,
  TextInput,
  Modal,
  Portal,
  FAB,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../stores/useAppStore';
import { RootStackParamList } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { 
    theme, 
    currentUser, 
    toggleThemeMode,
    notificationSettings,
    updateNotificationSettings,
    expenses,
    groups,
    updateUser,
    setCurrentUser,
  } = useAppStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    upiId: currentUser?.upiId || '',
  });

  // Calculate user stats
  const userStats = {
    totalExpenses: expenses.filter(e => e.paidBy === currentUser?.id).length,
    totalGroups: groups.filter(g => g.members.some(m => m.id === currentUser?.id)).length,
    totalPaid: expenses
      .filter(e => e.paidBy === currentUser?.id)
      .reduce((sum, e) => sum + e.totalAmount, 0),
    totalOwed: expenses.reduce((sum, expense) => {
      const participation = expense.participants.find(p => p.userId === currentUser?.id);
      return sum + (participation?.amount || 0);
    }, 0),
  };



  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={currentUser.name.charAt(0).toUpperCase()}
              style={{ backgroundColor: theme.primaryColor }}
              labelStyle={{ fontSize: 32, color: 'white' }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={{ color: theme.textColor, fontWeight: '700', fontSize: 20 }} numberOfLines={1} ellipsizeMode="tail">
                {currentUser.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                {currentUser.phone}
              </Text>
              {currentUser.email && (
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
                  {currentUser.email}
                </Text>
              )}
              {currentUser.upiId && (
                <Text variant="bodyMedium" style={{ color: theme.primaryColor, fontWeight: '500' }}>
                  UPI: {currentUser.upiId}
                </Text>
              )}
            </View>
            <Button
              mode="outlined"
              onPress={() => {
                setEditForm({
                  name: currentUser.name,
                  phone: currentUser.phone,
                  email: currentUser.email || '',
                  upiId: currentUser.upiId || '',
                });
                setShowEditModal(true);
              }}
              style={{ marginTop: 8, marginLeft: 8, flexShrink: 0 }}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* User Statistics */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor, ...(theme.mode === 'dark' ? { borderColor: theme.primaryColor + '40', borderWidth: 1 } : {}) }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.mode === 'dark' ? '#e5f9e0' : theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Your Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.primaryColor, fontWeight: '700' }}>
                  {userStats.totalGroups}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#111827', opacity: 1 }}>
                  Groups
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.primaryColor, fontWeight: '700' }}>
                  {userStats.totalExpenses}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#111827', opacity: 1 }}>
                  Expenses Paid
                </Text>
              </View>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#10b981', fontWeight: '700' }}>
                  ₹{userStats.totalPaid.toLocaleString()}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#111827', opacity: 1 }}>
                  Total Paid
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#ef4444', fontWeight: '700' }}>
                  ₹{userStats.totalOwed.toLocaleString()}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#111827', opacity: 1 }}>
                  Your Share
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Settings
            </Text>
            
            <List.Item
              title="Dark Mode"
              description="Switch between light and dark theme"
              left={(props) => <List.Icon {...props} icon="brightness-6" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={theme.mode === 'dark'}
                  onValueChange={toggleThemeMode}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <Divider style={{ marginVertical: 8 }} />
            
            <List.Item
              title="App Settings"
              description="Manage app preferences"
              left={(props) => <List.Icon {...props} icon="cog" color={theme.textColor} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textColor} />}
              onPress={() => navigation.navigate('Settings')}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Notifications
            </Text>
            
            <List.Item
              title="Expense Reminders"
              description="Get notified about pending expenses"
              left={(props) => <List.Icon {...props} icon="bell" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={notificationSettings.expenseReminders}
                  onValueChange={(value) => updateNotificationSettings({ expenseReminders: value })}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Settlement Reminders"
              description="Get notified about pending settlements"
              left={(props) => <List.Icon {...props} icon="cash" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={notificationSettings.settlementReminders}
                  onValueChange={(value) => updateNotificationSettings({ settlementReminders: value })}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="New Expense Alerts"
              description="Get notified when expenses are added"
              left={(props) => <List.Icon {...props} icon="receipt" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={notificationSettings.newExpenseAlerts}
                  onValueChange={(value) => updateNotificationSettings({ newExpenseAlerts: value })}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              About SplitPe
            </Text>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" color={theme.textColor} />}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Help & Support"
              description="Get help or report issues"
              left={(props) => <List.Icon {...props} icon="help-circle" color={theme.textColor} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textColor} />}
              onPress={() => navigation.navigate('HelpSupport' as any)}
              style={{ borderRadius: 12, marginVertical: 2, backgroundColor: theme.surfaceColor, elevation: 2 }}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
              rippleColor={theme.primaryColor + '20'}
            />
          </Card.Content>
        </Card>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal 
          visible={showEditModal} 
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.surfaceColor }]}
        >
          <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Edit Profile
          </Text>
          
          <TextInput
            label="Full Name"
            value={editForm.name}
            onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.primaryColor } }}
          />
          
          <TextInput
            label="Phone Number"
            value={editForm.phone}
            onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.primaryColor } }}
          />
          
          <TextInput
            label="Email (Optional)"
            value={editForm.email}
            onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.primaryColor } }}
          />
          
          <TextInput
            label="UPI ID (Optional)"
            value={editForm.upiId}
            onChangeText={(text) => setEditForm(prev => ({ ...prev, upiId: text }))}
            placeholder="yourname@paytm"
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.primaryColor } }}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowEditModal(false)}
              style={{ marginRight: 12 }}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {
                if (!currentUser) return;
                updateUser(currentUser.id, {
                  name: editForm.name,
                  phone: editForm.phone,
                  email: editForm.email,
                  upiId: editForm.upiId,
                });
                setCurrentUser({
                  ...currentUser,
                  name: editForm.name,
                  phone: editForm.phone,
                  email: editForm.email,
                  upiId: editForm.upiId,
                });
                setShowEditModal(false);
                Alert.alert('Success', 'Profile updated successfully!');
              }}
              style={{ backgroundColor: theme.primaryColor }}
            >
              Save
            </Button>
          </View>
        </Modal>
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
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    flexWrap: 'nowrap',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 2,
    minWidth: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});

export default ProfileScreen; 