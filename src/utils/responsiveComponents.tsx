import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  TextProps,
  ViewProps,
} from 'react-native';
import {
  fontSize,
  spacing,
  padding,
  borderRadius,
  buttonSize,
  cardDimensions,
  inputDimensions,
  shadow,
  screenDimensions,
  getResponsiveValue,
  widthPercentage,
} from './responsive';

// Responsive Container
interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  padding?: keyof typeof padding;
  margin?: keyof typeof spacing;
  backgroundColor?: string;
  flex?: number;
  center?: boolean;
  row?: boolean;
  spaceBetween?: boolean;
  spaceAround?: boolean;
  wrap?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  padding: paddingKey = 'md',
  margin: marginKey,
  backgroundColor,
  flex,
  center = false,
  row = false,
  spaceBetween = false,
  spaceAround = false,
  wrap = false,
  style,
  ...props
}) => {
  const containerStyle: ViewStyle = {
    padding: padding[paddingKey],
    margin: marginKey ? spacing[marginKey] : undefined,
    backgroundColor,
    flex,
    flexDirection: row ? 'row' : 'column',
    justifyContent: center
      ? 'center'
      : spaceBetween
      ? 'space-between'
      : spaceAround
      ? 'space-around'
      : 'flex-start',
    alignItems: center ? 'center' : 'flex-start',
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Responsive Text
interface ResponsiveTextProps extends TextProps {
  children: React.ReactNode;
  size?: keyof typeof fontSize;
  color?: string;
  weight?: 'normal' | 'bold' | '500' | '600' | '700' | '800' | '900';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = 'base',
  color,
  weight = 'normal',
  align = 'left',
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  ...props
}) => {
  const textStyle: TextStyle = {
    fontSize: fontSize[size],
    color,
    fontWeight: weight,
    textAlign: align,
  };

  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      {...props}
    >
      {children}
    </Text>
  );
};

// Responsive Button
interface ResponsiveButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  size?: keyof typeof buttonSize;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
  ...props
}) => {
  const buttonStyle: ViewStyle = {
    ...buttonSize[size],
    width: fullWidth ? '100%' : 'auto',
    backgroundColor: disabled
      ? '#e5e5e5'
      : variant === 'primary'
      ? '#40c9a2'
      : variant === 'secondary'
      ? '#a3f7b5'
      : 'transparent',
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: variant === 'outline' ? '#40c9a2' : 'transparent',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: disabled ? 0.6 : 1,
  };

  const textColor = disabled
    ? '#999'
    : variant === 'primary'
    ? '#fff'
    : variant === 'secondary'
    ? '#2f9c95'
    : '#40c9a2';

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <ResponsiveText
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'}
        color={textColor}
        weight="600"
        align="center"
      >
        {loading ? 'Loading...' : children}
      </ResponsiveText>
    </TouchableOpacity>
  );
};

// Responsive Card
interface ResponsiveCardProps extends ViewProps {
  children: React.ReactNode;
  padding?: keyof typeof padding;
  margin?: keyof typeof spacing;
  backgroundColor?: string;
  shadow?: keyof typeof shadow;
  onPress?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  padding: paddingKey = 'lg',
  margin: marginKey = 'sm',
  backgroundColor = '#fff',
  shadow: shadowKey = 'md',
  onPress,
  style,
  ...props
}) => {
  const cardStyle: ViewStyle = {
    padding: padding[paddingKey],
    margin: spacing[marginKey],
    backgroundColor,
    borderRadius: cardDimensions.borderRadius,
    ...shadow[shadowKey],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        activeOpacity={0.95}
        onPress={onPress}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Responsive Input Container
interface ResponsiveInputContainerProps extends ViewProps {
  children: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
}

export const ResponsiveInputContainer: React.FC<ResponsiveInputContainerProps> = ({
  children,
  error = false,
  disabled = false,
  style,
  ...props
}) => {
  const inputStyle: ViewStyle = {
    ...inputDimensions,
    backgroundColor: disabled ? '#f5f5f5' : '#fff',
    borderWidth: 1,
    borderColor: error ? '#ff4444' : '#e0e0e0',
  };

  return (
    <View style={[inputStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Responsive List Item
interface ResponsiveListItemProps extends TouchableOpacityProps {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  subtitle?: string;
  chevron?: boolean;
  disabled?: boolean;
}

export const ResponsiveListItem: React.FC<ResponsiveListItemProps> = ({
  children,
  leftIcon,
  rightIcon,
  subtitle,
  chevron = false,
  disabled = false,
  style,
  ...props
}) => {
  const itemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: padding.lg,
    minHeight: 56,
    backgroundColor: '#fff',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <TouchableOpacity
      style={[itemStyle, style]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {leftIcon && (
        <View style={{ marginRight: spacing.md }}>
          {leftIcon}
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <ResponsiveText size="base" weight="500">
          {children}
        </ResponsiveText>
        {subtitle && (
          <ResponsiveText size="sm" color="#666" style={{ marginTop: spacing.xs }}>
            {subtitle}
          </ResponsiveText>
        )}
      </View>
      
      {rightIcon && (
        <View style={{ marginLeft: spacing.md }}>
          {rightIcon}
        </View>
      )}
      
      {chevron && (
        <View style={{ marginLeft: spacing.md }}>
          <ResponsiveText size="lg" color="#ccc">›</ResponsiveText>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Responsive Grid
interface ResponsiveGridProps extends ViewProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: keyof typeof spacing;
  padding?: keyof typeof padding;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 2,
  spacing: spacingKey = 'md',
  padding: paddingKey = 'md',
  style,
  ...props
}) => {
  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: padding[paddingKey],
    marginHorizontal: -spacing[spacingKey] / 2,
  };

  const itemStyle: ViewStyle = {
    width: `${100 / columns}%`,
    paddingHorizontal: spacing[spacingKey] / 2,
    paddingVertical: spacing[spacingKey] / 2,
  };

  return (
    <View style={[gridStyle, style]} {...props}>
      {React.Children.map(children, (child) => (
        <View style={itemStyle}>
          {child}
        </View>
      ))}
    </View>
  );
};

// Responsive Scroll Container
interface ResponsiveScrollContainerProps extends ViewProps {
  children: React.ReactNode;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: ViewStyle;
  padding?: keyof typeof padding;
}

export const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  padding: paddingKey = 'md',
  style,
  ...props
}) => {
  return (
    <ScrollView
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={[
        { padding: padding[paddingKey] },
        contentContainerStyle,
      ]}
      style={style}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// Responsive Safe Area Container
interface ResponsiveSafeAreaContainerProps extends ViewProps {
  children: React.ReactNode;
  backgroundColor?: string;
  padding?: keyof typeof padding;
}

export const ResponsiveSafeAreaContainer: React.FC<ResponsiveSafeAreaContainerProps> = ({
  children,
  backgroundColor = '#fff',
  padding: paddingKey = 'md',
  style,
  ...props
}) => {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: screenDimensions.isSmall ? spacing.xl : spacing['2xl'],
    paddingBottom: screenDimensions.isSmall ? spacing.lg : spacing.xl,
  };

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Responsive Header
interface ResponsiveHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  backgroundColor = '#fff',
  style,
  ...props
}) => {
  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: padding.lg,
    paddingVertical: spacing.md,
    backgroundColor,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  };

  return (
    <View style={[headerStyle, style]} {...props}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {leftAction && (
          <View style={{ marginRight: spacing.md }}>
            {leftAction}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ResponsiveText size="lg" weight="600">
            {title}
          </ResponsiveText>
          {subtitle && (
            <ResponsiveText size="sm" color="#666" style={{ marginTop: spacing.xs }}>
              {subtitle}
            </ResponsiveText>
          )}
        </View>
      </View>
      
      {rightAction && (
        <View style={{ marginLeft: spacing.md }}>
          {rightAction}
        </View>
      )}
    </View>
  );
};

// Responsive Empty State
interface ResponsiveEmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const ResponsiveEmptyState: React.FC<ResponsiveEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action,
  style,
  ...props
}) => {
  const emptyStateStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: padding.xl,
    paddingVertical: spacing['3xl'],
  };

  return (
    <View style={[emptyStateStyle, style]} {...props}>
      {icon && (
        <View style={{ marginBottom: spacing.lg }}>
          {icon}
        </View>
      )}
      
      <ResponsiveText
        size="xl"
        weight="600"
        align="center"
        style={{ marginBottom: spacing.sm }}
      >
        {title}
      </ResponsiveText>
      
      {subtitle && (
        <ResponsiveText
          size="base"
          color="#666"
          align="center"
          style={{ marginBottom: spacing.xl }}
        >
          {subtitle}
        </ResponsiveText>
      )}
      
      {action && action}
    </View>
  );
}; 