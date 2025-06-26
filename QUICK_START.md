# 🚀 SplitPe - Quick Start Guide

Get SplitPe running on your device in under 5 minutes!

## 📱 Instant Setup (Easiest)

### 1. Install Expo Go
- **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd kap

# Install dependencies
npm install

# Start the development server
npm start
```

### 3. Scan QR Code
- Open Expo Go app on your phone
- Scan the QR code from your terminal/browser
- SplitPe will load directly on your device! 🎉

## 💻 Development Setup

### Prerequisites
```bash
# Install Node.js (v16+)
node --version

# Install Expo CLI globally
npm install -g expo-cli

# Verify installation
expo --version
```

### Installation
```bash
# Install all dependencies
npm install

# Start development server
npm start

# Alternative commands
expo start          # Same as npm start
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator (macOS only)
npm run web         # Run in web browser
```

## 🎯 What You'll See

### Sample Data
The app comes pre-loaded with:
- ✅ **3 Sample Groups**: Goa Trip, Apartment Rent, Office Lunch
- ✅ **4 Sample Users**: You + Rahul, Priya, Amit, Neha
- ✅ **Demo Expenses**: Ready-to-explore transactions

### Key Features to Try
1. **📱 Groups Tab**: Browse existing groups
2. **💳 Dashboard**: See your expense overview
3. **📊 Expenses**: View all transactions
4. **👤 Profile**: Toggle dark mode, adjust settings
5. **➕ Create Group**: Add new expense groups

## 🔧 Troubleshooting

### Common Issues

#### "Metro bundler not found"
```bash
npx expo install
npm start
```

#### "Dependencies not found"
```bash
rm -rf node_modules
npm install
npm start
```

#### QR Code not working
```bash
# Try web version first
npm run web

# Or use tunnel mode
expo start --tunnel
```

#### iOS Simulator not opening
```bash
# Open iOS Simulator manually
open -a Simulator
npm run ios
```

## 🎨 Customization

### Change App Theme
1. Go to **Profile** tab
2. Toggle **Dark Mode** switch
3. Watch the entire app change themes!

### Create Your First Group
1. Tap **➕ New Group** on Groups screen
2. Enter group name (e.g., "Weekend Trip")
3. Select purpose (Trip, Rent, Party, etc.)
4. Add members or use existing contacts
5. Tap **Create Group**

### Add Sample Expense
*Note: Full expense features coming in future updates*

## 📱 Platform-Specific Notes

### Android
- Ensure USB debugging is enabled
- Grant permissions for SMS/Contacts when prompted
- UPI integration works with installed UPI apps

### iOS
- Simulator included with Xcode
- Physical device requires Apple Developer account
- UPI links open system browser

### Web
- Limited mobile features
- Great for desktop testing
- All core functionality available

## 🚀 Next Steps

### For Users
1. **Explore** the sample data
2. **Create** your first real group
3. **Invite** friends to join
4. **Track** expenses together

### For Developers
1. **Study** the codebase structure
2. **Modify** colors and themes
3. **Add** new features
4. **Contribute** improvements

## 💡 Pro Tips

### Performance
- Use Expo Go for fastest development
- Enable Fast Refresh in Expo CLI
- Test on real devices for best UX

### Development
- Check `src/stores/useAppStore.ts` for state management
- Modify `src/components/GroupCard.tsx` for UI changes
- Add new screens in `src/screens/` directory

### UPI Testing
- Test with `upi://pay` URLs
- Use sample UPI IDs: `test@paytm`, `demo@phonepe`
- Check `src/utils/upi.ts` for integration helpers

## 🆘 Need Help?

### Quick Fixes
```bash
# Clear Expo cache
expo start -c

# Reset Metro bundler
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Resources
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **React Native Paper**: [reactnativepaper.com](https://reactnativepaper.com)
- **React Navigation**: [reactnavigation.org](https://reactnavigation.org)

### Get Support
1. Check existing [GitHub Issues](../issues)
2. Create new issue with error details
3. Include device info and screenshots

---

<div align="center">
  <h3>🎉 Enjoy building with SplitPe!</h3>
  <p>Happy coding and expense splitting! 💰📱</p>
</div> 