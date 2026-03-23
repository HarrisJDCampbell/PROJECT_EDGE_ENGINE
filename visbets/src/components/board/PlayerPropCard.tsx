/**
 * PlayerPropCard - Redesigned Layout
 * Large central player image with PP/VisBets/UD lines below
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated as RNAnimated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { EnhancedPlayerProp } from '../../services/api/types';
import { useUserStatsStore } from '../../stores/userStatsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/styles';
import { getInitials } from '../../utils/formatters';

interface PlayerPropCardProps {
  enhancedProp: EnhancedPlayerProp;
  leftLine?: number;
  rightLine?: number;
  leftLabel?: string;
  rightLabel?: string;
}

/** Use backend-resolved headshot URL (from resolveNBAPersonId pipeline). */
function getPlayerImageUrl(imageUrl?: string): string {
  return imageUrl ?? '';
}

export const PlayerPropCard = React.memo(function PlayerPropCard({
  enhancedProp,
  leftLine,
  rightLine,
  leftLabel = 'PP',
  rightLabel = 'UD',
}: PlayerPropCardProps) {
  const router = useRouter();
  const { prop, projection, edge } = enhancedProp;
  const [imageError, setImageError] = useState(false);

  // Scale animation for press feedback
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handleCardPress = useCallback(() => {
    // Track prop view
    useUserStatsStore.getState().incrementPropsViewed();

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const queryParams = new URLSearchParams();
    queryParams.set('market', prop.stat_type);
    queryParams.set('playerName', prop.player_name);
    if (prop.game_id) {
      queryParams.set('gameId', String(prop.game_id));
    }
    if (prop.image_url) {
      queryParams.set('headshotUrl', prop.image_url);
    }

    // Use numeric API-Sports ID when available, fall back to name
    const hasValidId = typeof prop.player_id === 'number' && prop.player_id > 0 && !isNaN(prop.player_id);
    const routeId = hasValidId
      ? String(prop.player_id)
      : encodeURIComponent(prop.player_name);
    if (!routeId) return; // guard against empty player name
    const href = `/player/${routeId}?${queryParams.toString()}`;
    router.push(href as any);
  }, [prop, router]);

  const imageUrl = getPlayerImageUrl(prop.image_url);
  const showImage = !!imageUrl && !imageError;

  // Detect if projection data has been stripped (free-tier user).
  // The backend sends ~5 free-unlocked props daily with real data,
  // so those will have projected_value > 0 and won't be locked.
  const isLocked = !projection.projected_value && projection.confidence === 0;

  // Pulse animation for locked VIS box
  const pulseAnim = useRef(new RNAnimated.Value(0.4)).current;
  useEffect(() => {
    if (!isLocked) return;
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        RNAnimated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLocked]);

  const edgeColor = edge > 2 ? colors.semantic.success : edge < -2 ? colors.semantic.danger : colors.text.secondary;
  const edgeSign = edge > 0 ? '+' : '';

  // Use the left/right lines from props; left falls back to base line
  // (p.line is resolved via the bookmaker=leftBook API param)
  const leftBookLine = leftLine ?? prop.line;
  const rightBookLine = rightLine ?? null;

  // Determine VIS box color based on projection vs left book line
  const visProjection = projection.projected_value;
  const isOverLeft = !isLocked && leftBookLine !== null ? visProjection > leftBookLine : !isLocked && edge > 0;
  const isUnderLeft = !isLocked && leftBookLine !== null ? visProjection < leftBookLine : !isLocked && edge < 0;

  // Green if VIS > left book line (over), Red if VIS < left book line (under), neutral otherwise
  const visBoxBgColor = isLocked
    ? colors.background.elevated
    : isOverLeft
      ? colors.semantic.success + '20'
      : isUnderLeft
        ? colors.semantic.danger + '20'
        : colors.primary.main + '15';
  const visBoxBorderColor = isLocked
    ? colors.border.default + '60'
    : isOverLeft
      ? colors.semantic.success + '80'
      : isUnderLeft
        ? colors.semantic.danger + '80'
        : colors.primary.main + '60';
  const visTextColor = isOverLeft
    ? colors.semantic.success
    : isUnderLeft
      ? colors.semantic.danger
      : colors.primary.main;

  return (
    <Animated.View style={[styles.touchableContainer, animatedStyle]}>
      <Pressable
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.card} pointerEvents="box-none">
        <LinearGradient
          colors={[colors.background.secondary, colors.background.tertiary]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header: Name + Stat Badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.playerName} numberOfLines={1}>
              {prop.player_name}
            </Text>
            <Text style={styles.matchup}>
              {prop.team} vs {prop.opponent}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>{prop.stat_type}</Text>
          </View>
        </View>

        {/* Large Central Player Image */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer} pointerEvents="none">
            {showImage ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.playerImage}
                onError={() => setImageError(true)}
                cachePolicy="memory-disk"
                transition={200}
                contentFit="contain"
              />
            ) : (
              <View style={styles.fallbackAvatar}>
                <Text style={styles.fallbackAvatarText}>
                  {getInitials(prop.player_name)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Lines Row: [Left Book] | VISBETS | [Right Book] */}
        <View style={styles.linesRow}>
          {/* Left Book Line */}
          <View style={styles.lineBox}>
            <Text style={styles.lineLabel}>{leftLabel}</Text>
            {leftBookLine !== null ? (
              <Text style={styles.lineValue}>{leftBookLine.toFixed(1)}</Text>
            ) : (
              <Text style={styles.lineValueNA}>—</Text>
            )}
          </View>

          {/* VISBETS Line - Center (highlighted with dynamic color) */}
          {isLocked ? (
            <RNAnimated.View style={[
              styles.visLineBox,
              {
                backgroundColor: colors.background.elevated,
                borderColor: pulseAnim.interpolate({
                  inputRange: [0.4, 1],
                  outputRange: [colors.primary.main + '40', colors.primary.main],
                }),
                borderWidth: 1.5,
                shadowColor: colors.primary.main,
                shadowOpacity: pulseAnim,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              },
            ]}>
              <Text style={[styles.visLineLabel, { color: colors.primary.main }]}>VIS</Text>
              <Ionicons name="lock-closed" size={16} color={colors.primary.main} />
            </RNAnimated.View>
          ) : (
            <View style={[
              styles.visLineBox,
              { backgroundColor: visBoxBgColor, borderColor: visBoxBorderColor }
            ]}>
              <Text style={[styles.visLineLabel, { color: visTextColor }]}>VIS</Text>
              <Text style={[styles.visLineValue, { color: visTextColor }]}>
                {projection.projected_value.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Right Book Line */}
          <View style={styles.lineBox}>
            <Text style={styles.lineLabel}>{rightLabel}</Text>
            {rightBookLine !== null ? (
              <Text style={styles.lineValue}>{rightBookLine.toFixed(1)}</Text>
            ) : (
              <Text style={styles.lineValueNA}>—</Text>
            )}
          </View>
        </View>


      </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  touchableContainer: {
    borderRadius: 16,
  },
  pressable: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default + '40',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.xs,
  },
  playerName: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  matchup: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  statBadge: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary.main + '50',
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },

  // Large Image Section
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  imageContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  fallbackAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary.main + '40',
  },
  fallbackAvatarText: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },

  // Lines Row
  linesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  lineBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default + '50',
    minHeight: 52,
  },
  lineLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  lineValue: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  lineValueNA: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // VIS Line Box (highlighted)
  visLineBox: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary.main + '60',
    minHeight: 52,
  },
  visLineLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  visLineValue: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    textAlign: 'center',
    textShadowColor: colors.primary.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default + '40',
    marginTop: spacing.xs,
  },
  recoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  recoBadgeText: {
    fontSize: 11,
    fontWeight: '800' as any,
    letterSpacing: 0.5,
  },
  recoEdgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  avoidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  avoidBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primary.main + '15',
    borderWidth: 1,
    borderColor: colors.primary.main + '40',
  },
  lockedBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  confidenceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confidenceBar: {
    flex: 1,
    height: 5,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    minWidth: 30,
    textAlign: 'right',
  },
});
