import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  StatusBar,
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export default function Header({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  style,
  titleStyle
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBackButton && navigation.canGoBack() && (
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {rightComponent && rightComponent}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  backBtn: {
    padding: SPACING.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
});
