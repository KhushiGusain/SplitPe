# SplitPe - Smart UPI-Based Expense Splitter

<div align="center">
  <h3>A Modern React Native App for the Indian Bharat Gen Z</h3>
  <p>Track and settle group expenses with UPI integration</p>
</div>

## 🚀 Features

### Core Functionality
- **Create Groups** - Organize expenses by purpose (Trip, Rent, Party, Office Snacks, etc.)
- **Add Expenses** - Track who paid what with UPI transaction details
- **Smart Splitting** - Equal, custom, or itemized expense splitting
- **UPI Integration** - Generate UPI payment links for settlements
- **Balance Tracking** - Real-time calculation of who owes what
- **Settlement Optimization** - Minimize the number of transactions needed

### UI/UX Highlights
- **Groww-inspired Design** - Clean, minimal aesthetic with beautiful cards
- **Dark/Light Themes** - Automatic theme switching
- **Modern Navigation** - Bottom tabs with stack navigation
- **Responsive Design** - Optimized for mobile devices
- **Color-coded Balances** - Visual indicators for debts and credits

### Technical Features
- **Offline-first** - Works without internet connection
- **Data Persistence** - State saved locally with AsyncStorage
- **TypeScript** - Full type safety throughout the codebase
- **Modern State Management** - Zustand for clean, performant state
- **Cross-platform** - iOS and Android support via React Native

## 📱 Screenshots

*The app features a clean, modern interface inspired by popular fintech apps like Groww.*

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation v6
- **Storage**: AsyncStorage
- **Icons**: Ionicons from Expo Vector Icons

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally with `npm install -g expo-cli`
- **Git** - [Download here](https://git-scm.com/)

### For Development
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Expo Go App** (for testing on real devices)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kap
```

### 2. Install Dependencies
```bash
npm install
```

Or if you prefer yarn:
```bash
yarn install
```

### 3. Start the Development Server
```bash
npm start
```

Or:
```bash
yarn start
# or
expo start
```

### 4. Run on Device/Simulator

#### Option A: Use Expo Go (Recommended for beginners)
1. Install Expo Go app on your phone
2. Scan the QR code from the terminal/browser
3. App will load on your device

#### Option B: Use Simulators
```bash
# For iOS (macOS only)
npm run ios

# For Android
npm run android

# For Web
npm run web
```

## 📁 Project Structure

```
splitpe/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── GroupCard.tsx    # Group display card
│   │   ├── screens/             # App screens
│   │   │   ├── GroupsScreen.tsx      # Main groups listing
│   │   │   ├── DashboardScreen.tsx   # Analytics & overview
│   │   │   ├── ExpensesScreen.tsx    # All expenses view
│   │   │   ├── ProfileScreen.tsx     # User profile & settings
│   │   │   ├── CreateGroupScreen.tsx # Group creation form
│   │   │   └── ...              # Other screens
│   │   ├── stores/              # State management
│   │   │   └── useAppStore.ts   # Main Zustand store
│   │   ├── types/               # TypeScript definitions
│   │   │   └── index.ts         # All app types
│   │   └── utils/               # Utility functions
│   │       ├── upi.ts           # UPI integration helpers
│   │       └── calculations.ts  # Expense calculation logic
│   ├── App.tsx                  # Main app component
│   ├── package.json            # Dependencies & scripts
│   └── app.json               # Expo configuration
└── README.md              # This file
```

## 🎨 Key Components

### GroupCard Component
Beautiful card design displaying:
- Group purpose with color-coded icons
- Total expenses and member count
- User's balance status
- Pending settlement indicators

### AppStore (Zustand)
Centralized state management for:
- User authentication & profiles
- Groups and members
- Expenses and participants
- Settlements and balances
- App theme and settings

### UPI Utilities
Helper functions for:
- Generating UPI payment links
- Opening UPI apps
- Parsing transaction SMS
- Validating UPI IDs

## 💡 Usage Examples

### Creating a Group
```typescript
// The app automatically sets up sample data on first launch
// Users can create new groups with:
// - Group name and description
// - Purpose selection (Trip, Rent, Party, etc.)
// - Member addition (contacts or manual)
```

### Adding Expenses
```typescript
// Expenses can be added with:
// - Title and description
// - Amount and who paid
// - Split type (equal, custom, itemized)
// - UPI transaction reference
```

### Settling Balances
```typescript
// The app calculates optimal settlements
// and provides UPI payment links for easy transfer
```

## 🎯 Core Features Implementation

### Smart Balance Calculation
The app uses an optimized algorithm to:
1. Calculate individual balances per group
2. Determine net amounts (who owes/is owed)
3. Generate minimal settlement transactions
4. Track payment statuses

### UPI Integration
- Generate standard UPI payment links
- Support for all major UPI apps (GPay, PhonePe, Paytm)
- Parse UPI transaction SMS (with permissions)
- Validate UPI IDs and amounts

### Theme System
- Material Design 3 theming
- Automatic dark/light mode
- Consistent color palette
- Responsive design patterns

## 🔧 Configuration

### Expo Configuration (`app.json`)
- App metadata and icons
- Platform-specific settings
- Required permissions for SMS/Contacts
- UPI scheme handling

### Development Scripts
```bash
# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Build for production
npm run build
```

## 📱 Platform Support

### Android
- Minimum SDK: 21 (Android 5.0)
- Target SDK: Latest
- UPI app integration
- SMS reading permissions

### iOS
- Minimum iOS: 11.0
- UPI link opening
- Contact access

### Web
- Progressive Web App support
- Limited UPI functionality
- Responsive design

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit changes**: `git commit -m 'Add feature'`
6. **Push to branch**: `git push origin feature-name`
7. **Submit a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use React Native Paper components
- Maintain consistent code formatting
- Add comments for complex logic
- Test on both platforms

## 🐛 Known Issues & Limitations

- **SMS Reading**: Requires Android permissions
- **UPI Integration**: Limited to link generation (no direct API)
- **Contact Sync**: Manual contact addition in current version
- **Offline Mode**: Full functionality without real-time sync

## 🔄 Future Enhancements

### Planned Features
- **Real-time Sync** - Cloud synchronization
- **Receipt OCR** - Automatic expense extraction
- **Advanced Analytics** - Spending insights
- **Multi-currency** - International expense support
- **Group Chat** - Built-in messaging
- **Expense Categories** - Detailed categorization

### Technical Improvements
- **Push Notifications** - Settlement reminders
- **Biometric Security** - App lock functionality
- **Export Options** - PDF/Excel reports
- **Integration APIs** - Bank transaction import

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **React Native Paper** - Beautiful Material Design components
- **Zustand** - Simple and powerful state management
- **Indian UPI System** - Inspiration for seamless payments

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues** tab for existing problems
2. **Create a new Issue** with detailed description
3. **Contact the development team**

---

<div align="center">
  <p>Built with ❤️ for the Indian tech community</p>
  <p>Happy expense splitting! 🎉</p>
</div> 