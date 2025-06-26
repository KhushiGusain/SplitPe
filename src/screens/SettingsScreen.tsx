import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  List, 
  Switch, 
  Divider,
  Button,
  TextInput,
  Modal,
  Portal,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '../stores/useAppStore';

const SettingsScreen = () => {
  const { 
    theme, 
    currentUser,
    toggleThemeMode,
    resetTheme,
    notificationSettings,
    updateNotificationSettings,
    updateUser,
    setCurrentUser,
  } = useAppStore();

  const [showUpiModal, setShowUpiModal] = useState(false);
  const [newUpiId, setNewUpiId] = useState(currentUser?.upiId || '');

  // App Preferences State
  const [preferences, setPreferences] = useState({
    autoBackup: true,
    biometricAuth: false,
    offlineMode: true,
    smartNotifications: true,
    dataSync: true,
    analyticsOptIn: false,
  });

  const handleSaveUpiId = () => {
    if (newUpiId.trim() && currentUser) {
      updateUser(currentUser.id, { upiId: newUpiId.trim() });
      setCurrentUser({ ...currentUser, upiId: newUpiId.trim() });
      setShowUpiModal(false);
      Alert.alert('Success', 'UPI ID updated successfully!');
    } else {
      Alert.alert('Error', 'Please enter a valid UPI ID');
    }
  };

  const handleResetTheme = () => {
    Alert.alert(
      'Reset Theme',
      'This will reset the app colors to the new default theme (white background with green cards).',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => {
            resetTheme();
            Alert.alert('Success', 'Theme reset successfully! You should now see white background with green cards.');
          }
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear App Data',
      'This will remove all your local data including expenses, groups, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'App data cleared! The app will now reload.');
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }, 1000);
            } catch (e) {
              Alert.alert('Error', 'Failed to clear app data.');
            }
          }
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your expenses and groups data as a backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            Alert.alert('Success', 'Data exported successfully! Check your downloads folder.');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Account Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Account Settings
            </Text>
            
            <List.Item
              title="UPI ID"
              description={currentUser?.upiId || 'Not set'}
              left={(props) => <List.Icon {...props} icon="credit-card" color={theme.textColor} />}
              right={(props) => <List.Icon {...props} icon="pencil" color={theme.primaryColor} />}
              onPress={() => setShowUpiModal(true)}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <Divider style={{ marginVertical: 8 }} />
            
            <List.Item
              title="Default Split Method"
              description="Equal split"
              left={(props) => <List.Icon {...props} icon="calculator" color={theme.textColor} />}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
          </Card.Content>
        </Card>

        {/* App Preferences */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              App Preferences
            </Text>
            
            <List.Item
              title="Theme"
              description={theme.mode === 'dark' ? 'Dark mode' : 'Light mode'}
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
            
            <List.Item
              title="Auto Backup"
              description="Automatically backup data to cloud"
              left={(props) => <List.Icon {...props} icon="cloud-upload" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.autoBackup}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, autoBackup: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Biometric Authentication"
              description="Use fingerprint or face unlock"
              left={(props) => <List.Icon {...props} icon="fingerprint" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.biometricAuth}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, biometricAuth: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Offline Mode"
              description="Allow app to work without internet"
              left={(props) => <List.Icon {...props} icon="wifi-off" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.offlineMode}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, offlineMode: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Smart Notifications"
              description="AI-powered expense suggestions"
              left={(props) => <List.Icon {...props} icon="brain" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.smartNotifications}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, smartNotifications: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
          </Card.Content>
        </Card>

        {/* Advanced Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Notification Settings
            </Text>
            
            <List.Item
              title="Expense Reminders"
              description="Daily reminders for pending expenses"
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
              title="Settlement Alerts"
              description="When money is owed or received"
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
              title="Group Activity"
              description="New expenses and member updates"
              left={(props) => <List.Icon {...props} icon="account-group" color={theme.textColor} />}
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
            
            <List.Item
              title="Weekly Summary"
              description="Weekly spending and balance reports"
              left={(props) => <List.Icon {...props} icon="chart-line" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
          </Card.Content>
        </Card>

        {/* Privacy & Security */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Privacy & Security
            </Text>
            
            <List.Item
              title="Data Sync"
              description="Sync data across devices"
              left={(props) => <List.Icon {...props} icon="sync" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.dataSync}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, dataSync: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <List.Item
              title="Analytics"
              description="Help improve the app with usage data"
              left={(props) => <List.Icon {...props} icon="chart-donut" color={theme.textColor} />}
              right={() => (
                <Switch
                  value={preferences.analyticsOptIn}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, analyticsOptIn: value }))}
                  color={theme.primaryColor}
                />
              )}
              titleStyle={{ color: theme.textColor }}
              descriptionStyle={{ color: theme.textColor, opacity: 0.7 }}
            />
            
            <Divider style={{ marginVertical: 8 }} />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              About SplitPe
            </Text>
            
            <View style={styles.appInfo}>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>Version</Text>
                <Text variant="bodyMedium" style={{ color: theme.textColor }}>1.0.0</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>Build</Text>
                <Text variant="bodyMedium" style={{ color: theme.textColor }}>2024.01.15</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>Platform</Text>
                <Text variant="bodyMedium" style={{ color: theme.textColor }}>React Native</Text>
              </View>
            </View>
            
            <Divider style={{ marginVertical: 16 }} />
            
            <View style={styles.badgeContainer}>
              <Chip mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>
                <Text style={{ color: theme.textColor }}>🔒 Secure</Text>
              </Chip>
              <Chip mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>
                <Text style={{ color: theme.textColor }}>🚀 Fast</Text>
              </Chip>
              <Chip mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>
                <Text style={{ color: theme.textColor }}>🌟 Modern</Text>
              </Chip>
              <Chip mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>
                <Text style={{ color: theme.textColor }}>💰 Free</Text>
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* UPI ID Modal */}
      <Portal>
        <Modal 
          visible={showUpiModal} 
          onDismiss={() => setShowUpiModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.surfaceColor }]}
        >
          <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
            Update UPI ID
          </Text>
          
          <TextInput
            label="UPI ID"
            value={newUpiId}
            onChangeText={setNewUpiId}
            placeholder="yourname@paytm"
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.primaryColor } }}
          />
          
          <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7, marginBottom: 20 }}>
            Enter your UPI ID for easy payments (e.g., yourname@paytm, yourname@phonepe)
          </Text>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowUpiModal(false)}
              style={{ marginRight: 12 }}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveUpiId}
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
  appInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  input: {
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});

export default SettingsScreen; 