import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { formatAmount } from '../utils/upi';
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

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  status?: string;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onPress, status }) => {
  const theme = useAppStore(state => state.theme);
  const expenses = useAppStore(state => state.getGroupExpenses(group.id));
  const balances = useAppStore(state => state.calculateUserBalances(group.id));
  const currentUser = useAppStore(state => state.currentUser);

  const userBalance = balances.find(b => b.userId === currentUser?.id);
  const totalPendingAmount = Math.abs(balances.reduce((sum, b) => sum + Math.abs(b.netBalance), 0) / 2);
  
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#40c9a2'; // Mint for positive balance
    if (balance < 0) return '#2f9c95'; // Persian green for negative balance
    return theme.textColor; // Neutral for zero balance
  };

  const getBalanceText = (balance: number) => {
    if (Math.abs(balance) < 0.01) return 'Settled';
    if (balance > 0) return `+${formatAmount(balance)}`;
    return `-${formatAmount(Math.abs(balance))}`;
  };

  const getPurposeIcon = (purpose: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Trip': 'airplane',
      'Rent': 'home',
      'Party': 'wine',
      'Office Snacks': 'cafe',
      'Dining': 'restaurant',
      'Others': 'ellipsis-horizontal',
    };
    return icons[purpose] || 'ellipsis-horizontal';
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
    return colors[purpose] || theme.primaryColor;
  };

  // Responsive avatar sizes
  const avatarSize = getResponsiveValue({
    small: 48,
    medium: 52,
    large: 56,
    xlarge: 60,
  });

  const memberAvatarSize = getResponsiveValue({
    small: 24,
    medium: 26,
    large: 28,
    xlarge: 30,
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}>
        <Card.Content style={styles.content}>
          {/* Main Row */}
          <View style={styles.mainRow}>
            {/* Left Side - Icon & Info */}
            <View style={styles.leftSection}>
              <Avatar.Icon
                size={avatarSize}
                icon={getPurposeIcon(group.purpose)}
                style={{ 
                  backgroundColor: getPurposeColor(group.purpose),
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
              />
              <View style={styles.groupInfo}>
                <Text variant="titleLarge" style={{ 
                  color: theme.textColor, 
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginBottom: 2,
                  fontSize: fontSize.lg,
                }}>
                  {group.name}
                </Text>
                <View style={styles.metaRow}>
                  <Text variant="bodyMedium" style={{ 
                    color: theme.textColor, 
                    opacity: 0.7,
                    fontWeight: '500',
                    fontSize: fontSize.sm,
                  }}>
                    {group.members.length} members
                  </Text>
                  <Text style={{ 
                    color: theme.textColor, 
                    opacity: 0.4, 
                    marginHorizontal: spacing.sm,
                    fontSize: fontSize.base,
                  }}>•</Text>
                  <Text variant="bodyMedium" style={{ 
                    color: theme.textColor, 
                    opacity: 0.7,
                    fontWeight: '500',
                    fontSize: fontSize.sm,
                  }}>
                    {expenses.length} expenses
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Side - Amount & Balance */}
            <View style={styles.rightSection}>
              <Text variant="bodyMedium" style={{ 
                color: theme.textColor, 
                opacity: 0.6, 
                textAlign: 'right',
                fontWeight: '600',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontSize: fontSize.xs,
              }}>
                Total
              </Text>
              <Text variant="headlineSmall" style={{ 
                color: theme.textColor, 
                fontWeight: '800', 
                textAlign: 'right',
                letterSpacing: -0.5,
                marginTop: 2,
                fontSize: fontSize['2xl'],
              }}>
                {formatAmount(group.totalExpenses)}
              </Text>
              
              {/* Balance Status */}
              {userBalance && Math.abs(userBalance.netBalance) > 0.01 && (
                <View style={[
                  styles.balanceChip, 
                  { backgroundColor: getBalanceColor(userBalance.netBalance) + '20' }
                ]}>
                  <Text 
                    variant="bodyMedium" 
                    style={{ 
                      color: getBalanceColor(userBalance.netBalance),
                      fontWeight: '700',
                      fontSize: fontSize.xs,
                      letterSpacing: 0.3,
                    }}
                  >
                    {getBalanceText(userBalance.netBalance)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Row - Members & Status */}
          <View style={styles.bottomRow}>
            {/* Members Preview */}
            <View style={styles.membersPreview}>
              {group.members.slice(0, 4).map((member, index) => (
                <Avatar.Text
                  key={member.id}
                  size={memberAvatarSize}
                  label={member.name.charAt(0).toUpperCase()}
                  style={[
                    styles.memberAvatar,
                    { 
                      backgroundColor: index % 2 === 0 ? theme.primaryColor : theme.accentColor,
                      marginLeft: index > 0 ? -spacing.sm : 0,
                      zIndex: 4 - index,
                    }
                  ]}
                  labelStyle={{ 
                    fontSize: fontSize.xs, 
                    color: index % 2 === 0 ? 'white' : theme.textColor, 
                    fontWeight: '700' 
                  }}
                />
              ))}
              {group.members.length > 4 && (
                <Text 
                  variant="bodyMedium" 
                  style={{ 
                    color: theme.textColor, 
                    opacity: 0.7,
                    marginLeft: spacing.md,
                    fontSize: fontSize.xs,
                    fontWeight: '600',
                  }}
                >
                  +{group.members.length - 4}
                </Text>
              )}
            </View>

            {/* Status Indicators */}
            <View style={styles.statusSection}>
              <Chip
                mode="flat"
                compact
                style={{ 
                  backgroundColor: getPurposeColor(group.purpose) + '20',
                  borderColor: getPurposeColor(group.purpose),
                  borderWidth: 1,
                  height: moderateScale(28),
                  elevation: 1,
                }}
                textStyle={{ 
                  color: getPurposeColor(group.purpose), 
                  fontSize: fontSize.xs,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                {group.purpose}
              </Chip>
              {/* Status chip for Pending/Completed */}
              {status && (
                <Chip
                  mode="outlined"
                  compact
                  style={{
                    backgroundColor: status === 'Completed' ? '#e0f7e9' : '#fffbe6',
                    borderColor: status === 'Completed' ? '#40c9a2' : '#fbbf24',
                    marginLeft: spacing.sm,
                    alignSelf: 'flex-start',
                  }}
                  textStyle={{
                    color: status === 'Completed' ? '#40c9a2' : '#fbbf24',
                    fontWeight: '700',
                    fontSize: fontSize.sm,
                  }}
                >
                  {status}
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 247, 181, 0.3)',
  },
  content: {
    padding: padding.lg,
    paddingVertical: padding.md,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: moderateScale(100),
    paddingLeft: spacing.md,
  },
  balanceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 247, 181, 0.2)',
  },
  membersPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    borderWidth: 3,
    borderColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingDot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 247, 181, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 162, 0.3)',
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#40c9a2',
    marginRight: spacing.sm,
  },
  pendingText: {
    fontSize: fontSize.xs,
    color: '#2f9c95',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default GroupCard; 