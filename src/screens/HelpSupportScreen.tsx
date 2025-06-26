import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/useAppStore';

const faqs = [
  {
    q: 'How do I add a new group or expense?',
    a: 'Go to the Groups tab to create a group, then use the Add Expense button inside the group to split bills with members.'
  },
  {
    q: 'How are payments tracked?',
    a: 'Payments are tracked automatically as members mark their shares as paid. You can also manually mark expenses as paid.'
  },
  {
    q: 'What if someone forgets to pay?',
    a: 'You can send reminders from the group or expense details. The app will also show pending payments in the dashboard.'
  },
  {
    q: 'How do I contact support?',
    a: 'Use the Contact Us button below to reach out to our support team for any issues or feedback.'
  },
  {
    q: 'Is my data secure?',
    a: 'Yes, SplitPe uses secure storage and never shares your data with third parties.'
  },
];

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const { theme } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} style={{ marginRight: 4 }} />
            <Text variant="headlineMedium" style={[styles.title, { color: theme.textColor }]}>Help & Support</Text>
          </View>
          <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}> 
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.primaryColor, fontWeight: '700', marginBottom: 8 }}>
                Welcome to SplitPe!
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.textColor, marginBottom: 8 }}>
                SplitPe helps you easily manage group expenses, track payments, and settle up with friends. Our mission is to make splitting bills simple, transparent, and stress-free for everyone.
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}> 
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.primaryColor, fontWeight: '600', marginBottom: 8 }}>
                Help & Support
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.textColor, marginBottom: 4 }}>
                Need assistance? Check the FAQs below. We're here to help you with any questions or issues.
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.card, { backgroundColor: theme.surfaceColor }]}> 
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.primaryColor, fontWeight: '600', marginBottom: 8 }}>
                Frequently Asked Questions
              </Text>
              {faqs.map((faq, idx) => (
                <View key={idx} style={styles.faqItem}>
                  <Text variant="bodyLarge" style={{ color: theme.textColor, fontWeight: '600', marginBottom: 2 }}>{faq.q}</Text>
                  <Text variant="bodyMedium" style={{ color: theme.textColor, opacity: 0.85, marginBottom: 8 }}>{faq.a}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Dimensions.get('window').height,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 24,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  faqItem: {
    marginBottom: 10,
  },
});

export default HelpSupportScreen; 