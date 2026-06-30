import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Animated, 
  ActivityIndicator,
  ViewStyle,
  StyleProp
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface LoaderProps {
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: 'small' | 'large';
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Loader({
  style,
  color = COLORS.primary,
  size = 'large'
}: LoaderProps) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.sm,
  style
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { 
          width: width as any, 
          height, 
          borderRadius, 
          opacity: opacityAnim 
        }, 
        style
      ]} 
    />
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.skeletonCard, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: SPACING.md }} />
      <Skeleton width="80%" height={14} style={{ marginTop: SPACING.sm }} />
      <View style={styles.cardFooter}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="20%" height={24} borderRadius={BORDER_RADIUS.xs} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
});
