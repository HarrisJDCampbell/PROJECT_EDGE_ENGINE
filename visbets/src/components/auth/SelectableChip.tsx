/**
 * SelectableChip Component
 * Selectable chip for sportsbook/sport selection
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/styles';
import { typography } from '../../theme/typography';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function SelectableChip({
  label,
  selected,
  onPress,
  icon,
  disabled = false,
}: SelectableChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && !selected && styles.chipDisabled,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={selected ? colors.primary.main : colors.text.secondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          disabled && !selected && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
      {selected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={14} color={colors.background.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.secondary,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
    flex: 1,
  },
  labelSelected: {
    color: colors.primary.main,
  },
  labelDisabled: {
    color: colors.text.muted,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
