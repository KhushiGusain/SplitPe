import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppStore } from '../stores/useAppStore';

const SettlementScreen = () => {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text variant="headlineMedium" style={{ color: theme.textColor }}>
        Settlement Screen
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.7 }}>
        Coming Soon...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

export default SettlementScreen; 