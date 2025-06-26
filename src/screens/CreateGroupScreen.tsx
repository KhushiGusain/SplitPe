import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, User } from '../types';
import { useAppStore } from '../stores/useAppStore';

type CreateGroupScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const CreateGroupScreen = () => {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const { 
    currentUser, 
    users, 
    theme, 
    createGroup, 
    addUser,
    setLoading,
  } = useAppStore();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('Trip');
  const [selectedMembers, setSelectedMembers] = useState<User[]>(currentUser ? [currentUser] : []);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const purposes = [
    { label: 'Trip', value: 'Trip', icon: 'airplane' },
    { label: 'Rent', value: 'Rent', icon: 'home' },
    { label: 'Party', value: 'Party', icon: 'wine' },
    { label: 'Dining', value: 'Dining', icon: 'restaurant' },
    { label: 'Office', value: 'Office Snacks', icon: 'cafe' },
    { label: 'Others', value: 'Others', icon: 'ellipsis-horizontal' },
  ];

  const purposeButtons = purposes.map(p => ({
    value: p.value,
    label: p.label,
    icon: p.icon,
  }));

  // Deduplicate available users by phone (or email if present)
  const availableUsers = Array.from(
    new Map(
      users
        .filter(user => user.id !== currentUser?.id && !selectedMembers.some(member => member.id === user.id))
        .map(user => [user.phone || user.email, user])
    ).values()
  );

  const handleAddMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user]);
  };

  const handleRemoveMember = (userId: string) => {
    if (userId === currentUser?.id) return; // Can't remove current user
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  const handleAddNewMember = () => {
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      setErrorMessage('Please enter both name and phone number');
      setErrorDialogVisible(true);
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      email: `${newMemberName.toLowerCase().replace(' ', '')}@example.com`,
    };

    addUser(newUser);
    handleAddMember(newUser);
    setNewMemberName('');
    setNewMemberPhone('');
  };

  const handleCreateGroup = async () => {
    // General check for all required fields
    if (!groupName.trim() || selectedMembers.length < 2 || !currentUser) {
      setErrorMessage('All fields must be filled.');
      setErrorDialogVisible(true);
      return;
    }

    setLoading(true);

    try {
      createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        purpose: purpose as any,
        members: selectedMembers,
        createdBy: currentUser.id,
        totalExpenses: 0,
        currency: 'INR',
        isActive: true,
      });

      navigation.navigate('Main');
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      setErrorMessage('Failed to create group. Please try again.');
      setErrorDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getPurposeIcon = (purposeValue: string) => {
    const purpose = purposes.find(p => p.value === purposeValue);
    return purpose?.icon || 'ellipsis-horizontal';
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Details Card */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Group Details
            </Text>
            
            <TextInput
              label="Group Name *"
              value={groupName}
              onChangeText={setGroupName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Goa Trip 2024"
              maxLength={50}
            />
            
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              placeholder="What's this group for?"
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          </Card.Content>
        </Card>

        {/* Purpose Selection */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Purpose
            </Text>
            
            <View style={styles.purposeGrid}>
              {purposes.map((purposeOption) => (
                <Chip
                  key={purposeOption.value}
                  selected={purpose === purposeOption.value}
                  onPress={() => setPurpose(purposeOption.value)}
                  style={[
                    styles.purposeChip,
                    {
                      backgroundColor: purpose === purposeOption.value 
                        ? theme.primaryColor 
                        : 'transparent',
                      borderColor: theme.primaryColor,
                      borderWidth: 1,
                    }
                  ]}
                  textStyle={{ 
                    color: purpose === purposeOption.value ? 'white' : theme.textColor 
                  }}
                  icon={purposeOption.icon}
                >
                  {purposeOption.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Add Members */}
        <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.textColor, marginBottom: 16, fontWeight: '600' }}>
              Members ({selectedMembers.length})
            </Text>

            {/* Current Members */}
            <View style={styles.membersContainer}>
              {selectedMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Avatar.Text
                    size={40}
                    label={member.name.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.primaryColor }}
                    labelStyle={{ color: 'white' }}
                  />
                  <View style={styles.memberInfo}>
                    <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '500' }}>
                      {member.name}
                      {member.id === currentUser?.id && ' (You)'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textColor, opacity: 0.7 }}>
                      {member.phone}
                    </Text>
                  </View>
                  {member.id !== currentUser?.id && (
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => handleRemoveMember(member.id)}
                      iconColor={theme.textColor}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Available Users */}
            {availableUsers.length > 0 && (
              <>
                <Text variant="bodyLarge" style={{ color: theme.textColor, marginTop: 16, marginBottom: 8, fontWeight: '500' }}>
                  Add Existing Contacts
                </Text>
                <View style={styles.availableUsers}>
                  {availableUsers.map((user) => (
                    <Chip
                      key={user.id}
                      onPress={() => handleAddMember(user)}
                      style={styles.userChip}
                      icon="plus"
                      textStyle={{ color: theme.textColor }}
                    >
                      {user.name}
                    </Chip>
                  ))}
                </View>
              </>
            )}

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
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Enter name"
              />
              <TextInput
                label="Phone"
                value={newMemberPhone}
                onChangeText={setNewMemberPhone}
                mode="outlined"
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
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
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.backgroundColor }]}>
        <Button
          mode="contained"
          onPress={handleCreateGroup}
          style={[styles.createButton, { backgroundColor: theme.primaryColor }]}
          contentStyle={styles.createButtonContent}
          labelStyle={{ color: 'white', fontSize: 16, fontWeight: '600' }}
        >
          Create Group
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
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  membersContainer: {
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  availableUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  userChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  newMemberContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
  bottomContainer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  createButton: {
    borderRadius: 12,
  },
  createButtonContent: {
    paddingVertical: 8,
  },
});

export default CreateGroupScreen; 