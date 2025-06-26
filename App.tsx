import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import GroupsScreen from './src/screens/GroupsScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import GroupDetailsScreen from './src/screens/GroupDetailsScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import ExpenseDetailsScreen from './src/screens/ExpenseDetailsScreen';
import SettlementScreen from './src/screens/SettlementScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';

// Import types and store
import { TabParamList, RootStackParamList } from './src/types';
import { useAppStore } from './src/stores/useAppStore';

// Import responsive utilities
import { 
  tabBarDimensions, 
  headerDimensions, 
  iconSize, 
  shadow,
  getPlatformValue,
  moderateScale 
} from './src/utils/responsive';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  const theme = useAppStore(state => state.theme);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={moderateScale(size)} color={color} />;
        },
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.surfaceColor,
          borderTopColor: theme.mode === 'dark' ? theme.accentColor : '#a3f7b540',
          borderTopWidth: 0,
          height: tabBarDimensions.height,
          paddingBottom: tabBarDimensions.paddingBottom,
          paddingTop: tabBarDimensions.paddingTop,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: theme.backgroundColor,
          height: headerDimensions.height,
        },
        headerTintColor: theme.textColor,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: headerDimensions.fontSize,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ title: 'Groups' }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{ title: 'Expenses' }}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const theme = useAppStore(state => state.theme);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundColor,
          height: headerDimensions.height,
        },
        headerTintColor: theme.textColor,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: headerDimensions.fontSize,
          fontWeight: '600',
        },
        headerTitleContainerStyle: {
          paddingHorizontal: headerDimensions.paddingHorizontal,
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ 
          title: 'Create Group',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetailsScreen}
        options={{ title: 'Group Details' }}
      />
      <Stack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen}
        options={{ 
          title: 'Add Expense',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditExpense" 
        component={EditExpenseScreen}
        options={{ 
          title: 'Edit Expense',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ExpenseDetails" 
        component={ExpenseDetailsScreen}
        options={{ title: 'Expense Details' }}
      />
      <Stack.Screen 
        name="Settlement" 
        component={SettlementScreen}
        options={{ title: 'Settle Up' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen}
        options={{ title: 'Help & Support', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { theme, currentUser, setCurrentUser } = useAppStore();

  // Create a sample user on first launch
  useEffect(() => {
    if (!currentUser) {
      const sampleUser = {
        id: 'user_1',
        name: 'You',
        phone: '+91 98765 43210',
        email: 'user@splitpe.com',
        upiId: 'yourname@paytm',
      };
      setCurrentUser(sampleUser);
    }
  }, [currentUser, setCurrentUser]);

  const customLightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: theme.primaryColor,
      background: theme.backgroundColor,
      surface: theme.surfaceColor,
      onSurface: theme.textColor,
    },
  };

  const customDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: theme.primaryColor,
      background: theme.backgroundColor,
      surface: theme.surfaceColor,
      onSurface: theme.textColor,
    },
  };

  const paperTheme = theme.mode === 'dark' ? customDarkTheme : customLightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      </PaperProvider>
    </SafeAreaProvider>
  );
} 