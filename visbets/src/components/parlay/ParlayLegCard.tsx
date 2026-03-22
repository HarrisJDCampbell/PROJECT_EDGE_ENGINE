/**
 * ParlayLegCard
 * Shows a player in the parlay with editable stat type, line, and over/under
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ParlayLeg, StatType } from '../../stores/parlayBuilderStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { getInitials } from '../../utils/formatters';

interface ParlayLegCardProps {
  leg: ParlayLeg;
  onUpdate: (legId: string, updates: Partial<Omit<ParlayLeg, 'id' | 'player'>>) => void;
  onRemove: (legId: string) => void;
}

const STAT_TYPES: StatType[] = ['PTS', 'REB', 'AST', 'PRA', '3PM', 'STL', 'BLK', 'TO'];

export function ParlayLegCard({ leg, onUpdate, onRemove }: ParlayLegCardProps) {
  const [imageError, setImageError] = useState(false);
  const [lineText, setLineText] = useState(leg.line.toString());
  const fullName = `${leg.player.first_name} ${leg.player.last_name}`;

  const handleStatTypeChange = () => {
    const currentIndex = STAT_TYPES.indexOf(leg.statType);
    const nextIndex = (currentIndex + 1) % STAT_TYPES.length;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onUpdate(leg.id, { statType: STAT_TYPES[nextIndex] });
  };

  const handleOverUnderToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onUpdate(leg.id, { isOver: !leg.isOver });
  };

  const handleLineChange = (value: string) => {
    setLineText(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(leg.id, { line: numValue });
    }
  };

  const handleLineBlur = () => {
    // If empty or invalid on blur, reset to current leg line
    const numValue = parseFloat(lineText);
    if (isNaN(numValue) || lineText.trim() === '') {
      setLineText(leg.line.toString());
    }
  };

  const handleRemove = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onRemove(leg.id);
  };

  return (
    <View style={styles.container}>
      {/* Player Image */}
      <View style={styles.imageContainer}>
        {leg.imageUrl && !imageError ? (
          <Image
            source={{ uri: leg.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.fallbackImage}>
            <Text style={styles.initials}>{getInitials(fullName)}</Text>
          </View>
        )}
      </View>

      {/* Player Info & Controls */}
      <View style={styles.contentContainer}>
        {/* Top Row: Name and Remove */}
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.playerName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.teamText}>{leg.player.team.abbreviation}</Text>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Ionicons name="close" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Bottom Row: Stat Type, Line, Over/Under */}
        <View style={styles.controlsRow}>
          {/* Stat Type Selector */}
          <TouchableOpacity style={styles.statButton} onPress={handleStatTypeChange}>
            <Text style={styles.statText}>{leg.statType}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary.main} />
          </TouchableOpacity>

          {/* Line Input */}
          <View style={styles.lineContainer}>
            <TextInput
              style={styles.lineInput}
              value={lineText}
              onChangeText={handleLineChange}
              onBlur={handleLineBlur}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>

          {/* Over/Under Toggle */}
          <View style={styles.overUnderContainer}>
            <TouchableOpacity
              style={[
                styles.overUnderButton,
                leg.isOver && styles.overUnderButtonActive,
              ]}
              onPress={() => { if (!leg.isOver) handleOverUnderToggle(); }}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={leg.isOver ? colors.background.primary : colors.text.muted}
              />
              <Text style={[
                styles.overUnderText,
                leg.isOver && styles.overUnderTextActive,
              ]}>O</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.overUnderButton,
                !leg.isOver && styles.overUnderButtonActiveUnder,
              ]}
              onPress={() => { if (leg.isOver) handleOverUnderToggle(); }}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={!leg.isOver ? colors.background.primary : colors.text.muted}
              />
              <Text style={[
                styles.overUnderText,
                !leg.isOver && styles.overUnderTextActiveUnder,
              ]}>U</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  initials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  teamText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  statText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  lineContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  lineInput: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    padding: 0,
  },
  overUnderContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  overUnderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  overUnderButtonActive: {
    backgroundColor: colors.semantic.success,
  },
  overUnderButtonActiveUnder: {
    backgroundColor: colors.semantic.danger,
  },
  overUnderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
  },
  overUnderTextActive: {
    color: colors.background.primary,
  },
  overUnderTextActiveUnder: {
    color: colors.background.primary,
  },
});
