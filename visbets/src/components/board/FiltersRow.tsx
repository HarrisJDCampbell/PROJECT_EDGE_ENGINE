import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

export type StatType = 'PTS' | 'REB' | 'AST' | 'PRA' | '3PM' | 'STL' | 'BLK';
export type TimeFilter = 'all' | 'soon' | 'tonight';
export type SortOption = 'edge' | 'confidence' | 'popular' | 'time';
export type BookOption = 'PrizePicks' | 'DraftKings' | 'Underdog';

interface FiltersRowProps {
  selectedStat: StatType;
  onStatChange: (stat: StatType) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedBook: BookOption;
  onBookChange: (book: BookOption) => void;
  showPositiveEdgeOnly: boolean;
  onTogglePositiveEdge: () => void;
}

const STAT_TYPES: StatType[] = ['PTS', 'REB', 'AST', 'PRA', '3PM'];
const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'soon', label: 'Starting Soon' },
  { value: 'tonight', label: 'Tonight' },
];
const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'edge', label: 'Best Edge', icon: 'trending-up' },
  { value: 'confidence', label: 'High Confidence', icon: 'checkmark-circle' },
  { value: 'popular', label: 'Most Popular', icon: 'flame' },
  { value: 'time', label: 'Game Time', icon: 'time' },
];
const BOOKS: BookOption[] = ['PrizePicks', 'DraftKings', 'Underdog'];

export function FiltersRow({
  selectedStat,
  onStatChange,
  timeFilter,
  onTimeFilterChange,
  sortBy,
  onSortChange,
  selectedBook,
  onBookChange,
  showPositiveEdgeOnly,
  onTogglePositiveEdge,
}: FiltersRowProps) {
  const [showTimeDropdown, setShowTimeDropdown] = React.useState(false);
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);
  const [showBookDropdown, setShowBookDropdown] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Stat Type Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statTypesScroll}
        contentContainerStyle={styles.statTypesContent}
      >
        {STAT_TYPES.map((stat) => (
          <TouchableOpacity
            key={stat}
            style={[
              styles.statPill,
              selectedStat === stat && styles.statPillActive,
            ]}
            onPress={() => onStatChange(stat)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statPillText,
                selectedStat === stat && styles.statPillTextActive,
              ]}
            >
              {stat}
            </Text>
            {selectedStat === stat && <View style={styles.statPillGlow} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Controls Row */}
      <View style={styles.controlsRow}>
        {/* Time Filter Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowTimeDropdown(!showTimeDropdown)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>
              {TIME_FILTERS.find(f => f.value === timeFilter)?.label}
            </Text>
            <Ionicons
              name={showTimeDropdown ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          {showTimeDropdown && (
            <View style={styles.dropdownMenu}>
              {TIME_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onTimeFilterChange(filter.value);
                    setShowTimeDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      timeFilter === filter.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sort Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={SORT_OPTIONS.find(s => s.value === sortBy)?.icon as any}
              size={14}
              color={colors.primary.main}
              style={styles.dropdownIcon}
            />
            <Text style={styles.dropdownText}>
              {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
            </Text>
            <Ionicons
              name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          {showSortDropdown && (
            <View style={styles.dropdownMenu}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSortChange(option.value);
                    setShowSortDropdown(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={14}
                    color={sortBy === option.value ? colors.primary.main : colors.text.tertiary}
                    style={styles.dropdownIcon}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      sortBy === option.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Book Selector */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdown, styles.bookDropdown]}
            onPress={() => setShowBookDropdown(!showBookDropdown)}
            activeOpacity={0.7}
          >
            <Text style={styles.bookText}>{selectedBook}</Text>
            <Ionicons
              name={showBookDropdown ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
          {showBookDropdown && (
            <View style={[styles.dropdownMenu, styles.bookDropdownMenu]}>
              {BOOKS.map((book) => (
                <TouchableOpacity
                  key={book}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onBookChange(book);
                    setShowBookDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedBook === book && styles.dropdownItemTextActive,
                    ]}
                  >
                    {book}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Quick Toggles */}
      <View style={styles.togglesRow}>
        <TouchableOpacity
          style={[styles.toggleChip, showPositiveEdgeOnly && styles.toggleChipActive]}
          onPress={onTogglePositiveEdge}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPositiveEdgeOnly ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={14}
            color={showPositiveEdgeOnly ? colors.primary.main : colors.text.tertiary}
          />
          <Text
            style={[
              styles.toggleChipText,
              showPositiveEdgeOnly && styles.toggleChipTextActive,
            ]}
          >
            Only Positive Edge
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '30',
  },
  statTypesScroll: {
    paddingHorizontal: spacing.lg,
  },
  statTypesContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  statPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
  },
  statPillActive: {
    backgroundColor: colors.primary.main + '20',
    borderColor: colors.primary.main,
  },
  statPillText: {
    ...typography.presets.label,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  statPillTextActive: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  statPillGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
    opacity: 0.1,
    borderRadius: 20,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
    minWidth: 120,
  },
  bookDropdown: {
    minWidth: 100,
  },
  dropdownText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  bookText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: spacing.xs,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    zIndex: 1000,
  },
  bookDropdownMenu: {
    minWidth: 140,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '20',
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  togglesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
  },
  toggleChipActive: {
    backgroundColor: colors.primary.main + '15',
    borderColor: colors.primary.main,
  },
  toggleChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  toggleChipTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});
