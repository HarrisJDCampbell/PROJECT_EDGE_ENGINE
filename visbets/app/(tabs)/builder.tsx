/**
 * Builder Tab - Custom Parlay Builder
 *
 * Flow: Search player → see prediction + book lines → pick OVER/UNDER → set line → add to parlay → analyze
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { useParlayBuilderStore, StatType } from '../../src/stores/parlayBuilderStore';
import { backendClient } from '../../src/services/api/backendClient';
import { useProjections, ProjectedProp } from '../../src/hooks/useProjections';
import { Player } from '../../src/services/api/types';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/styles';
import { getInitials } from '../../src/utils/formatters';
import { analyticsService } from '../../src/services/analytics/analyticsService';

const STAT_OPTIONS: StatType[] = ['PTS', 'REB', 'AST', '3PM', 'STL', 'BLK'];

const BOOK_LABELS: Record<string, string> = {
  fanduel: 'FD',
  draftkings: 'DK',
  betmgm: 'MGM',
  caesars: 'CZR',
  espnbet: 'EPN',
};

// ── Player Prop Card (shown after search selection) ─────────────────────────

interface PlayerPropPreviewProps {
  player: Player;
  projections: ProjectedProp[];
  imageUrl?: string;
  onAdd: (player: Player, statType: StatType, line: number, isOver: boolean, imageUrl?: string) => void;
  isAdded: boolean;
}

function PlayerPropPreview({ player, projections, imageUrl, onAdd, isAdded }: PlayerPropPreviewProps) {
  const fullName = `${player.first_name} ${player.last_name}`;
  const [selectedStat, setSelectedStat] = useState<StatType>('PTS');
  const [isOver, setIsOver] = useState(true);
  const [lineText, setLineText] = useState('');
  const [imageError, setImageError] = useState(false);

  // Find matching projection for this player + stat
  const proj = useMemo(() => {
    const statMap: Record<string, string> = { PTS: 'PTS', REB: 'REB', AST: 'AST', '3PM': '3PM', STL: 'STL', BLK: 'BLK' };
    return projections.find(
      (p) => p.playerName.toLowerCase() === fullName.toLowerCase() && p.statDisplay === statMap[selectedStat]
    ) ?? null;
  }, [projections, fullName, selectedStat]);

  // Auto-fill line from projection when stat changes
  useEffect(() => {
    if (proj) {
      setLineText(proj.line.toString());
      setIsOver(proj.direction ? proj.direction === 'over' : true);
    } else {
      setLineText('');
    }
  }, [proj, selectedStat]);

  // Book lines from projection
  const bookLines = proj?.bookLines ?? {};

  const handleAdd = () => {
    const line = parseFloat(lineText);
    if (isNaN(line) || line <= 0) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAdd(player, selectedStat, line, isOver, imageUrl);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={ppStyles.card}>
      <LinearGradient
        colors={[colors.background.secondary, colors.background.tertiary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header: avatar + name + close hint */}
      <View style={ppStyles.header}>
        <View style={ppStyles.avatarBox}>
          {imageUrl && !imageError ? (
            <ExpoImage source={{ uri: imageUrl }} style={ppStyles.avatar} onError={() => setImageError(true)} contentFit="cover" />
          ) : (
            <View style={ppStyles.avatarFallback}>
              <Text style={ppStyles.avatarInitials}>{getInitials(fullName)}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ppStyles.playerName}>{fullName}</Text>
          <Text style={ppStyles.teamText}>{player.team?.full_name || player.team?.abbreviation || ''}</Text>
        </View>
      </View>

      {/* Our prediction (locked for free users when analytics are stripped) */}
      {proj && proj.projection != null && (
        <View style={ppStyles.predictionRow}>
          <View style={ppStyles.predictionBox}>
            <Text style={ppStyles.predictionLabel}>VIS PREDICTION</Text>
            <Text style={ppStyles.predictionValue}>{proj.projection.toFixed(1)}</Text>
          </View>
          <View style={ppStyles.predictionBox}>
            <Text style={ppStyles.predictionLabel}>SCORE</Text>
            <Text style={[ppStyles.predictionValue, { color: colors.primary.main }]}>{proj.visbetsScore}</Text>
          </View>
          <View style={ppStyles.predictionBox}>
            <Text style={ppStyles.predictionLabel}>EDGE</Text>
            <Text style={[ppStyles.predictionValue, { color: proj.edge > 0 ? colors.semantic.success : colors.semantic.danger }]}>
              {proj.edge > 0 ? '+' : ''}{(proj.edge * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}
      {proj && proj.projection == null && (
        <View style={[ppStyles.predictionRow, { justifyContent: 'center', paddingVertical: spacing.md }]}>
          <Ionicons name="lock-closed" size={16} color={colors.primary.main} />
          <Text style={[ppStyles.predictionLabel, { color: colors.primary.main, marginLeft: 6 }]}>
            Upgrade to see projections & edge
          </Text>
        </View>
      )}

      {/* Book lines strip */}
      {Object.keys(bookLines).length > 0 && (
        <View style={ppStyles.booksRow}>
          {Object.entries(bookLines).map(([key, line]) => {
            if (line == null) return null;
            return (
              <View key={key} style={ppStyles.bookChip}>
                <Text style={ppStyles.bookLabel}>{BOOK_LABELS[key] ?? key.slice(0, 3).toUpperCase()}</Text>
                <Text style={ppStyles.bookLine}>{line}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Stat selector */}
      <View style={ppStyles.statRow}>
        {STAT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[ppStyles.statChip, selectedStat === s && ppStyles.statChipActive]}
            onPress={() => setSelectedStat(s)}
          >
            <Text style={[ppStyles.statChipText, selectedStat === s && ppStyles.statChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Over/Under + Line + Add */}
      <View style={ppStyles.actionRow}>
        {/* Over / Under toggle */}
        <View style={ppStyles.ouContainer}>
          <TouchableOpacity
            style={[ppStyles.ouButton, isOver && ppStyles.ouButtonOver]}
            onPress={() => setIsOver(true)}
          >
            <Ionicons name="arrow-up" size={14} color={isOver ? '#000' : colors.text.muted} />
            <Text style={[ppStyles.ouText, isOver && ppStyles.ouTextActive]}>OVER</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ppStyles.ouButton, !isOver && ppStyles.ouButtonUnder]}
            onPress={() => setIsOver(false)}
          >
            <Ionicons name="arrow-down" size={14} color={!isOver ? '#000' : colors.text.muted} />
            <Text style={[ppStyles.ouText, !isOver && ppStyles.ouTextActive]}>UNDER</Text>
          </TouchableOpacity>
        </View>

        {/* Line input */}
        <View style={ppStyles.lineBox}>
          <TextInput
            style={ppStyles.lineInput}
            value={lineText}
            onChangeText={setLineText}
            keyboardType="decimal-pad"
            placeholder="Line"
            placeholderTextColor={colors.text.muted}
            selectTextOnFocus
          />
        </View>

        {/* Add button */}
        <TouchableOpacity
          style={[ppStyles.addButton, isAdded && ppStyles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isAdded || !lineText || parseFloat(lineText) <= 0}
        >
          <Ionicons name={isAdded ? 'checkmark' : 'add'} size={20} color={isAdded ? colors.text.muted : '#000'} />
          <Text style={[ppStyles.addButtonText, isAdded && { color: colors.text.muted }]}>
            {isAdded ? 'Added' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const ppStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarBox: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.background.tertiary },
  avatar: { width: 52, height: 52 },
  avatarFallback: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary.main + '20' },
  avatarInitials: { fontSize: 18, fontWeight: '800' as any, color: colors.primary.main },
  playerName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  teamText: { fontSize: typography.fontSize.sm, color: colors.text.muted, marginTop: 2 },
  predictionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  predictionBox: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  predictionLabel: { fontSize: 8, fontWeight: '700' as any, color: colors.text.muted, letterSpacing: 0.8, marginBottom: 2 },
  predictionValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  booksRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  bookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  bookLabel: { fontSize: 9, fontWeight: '700' as any, color: colors.text.muted, letterSpacing: 0.5 },
  bookLine: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statChipActive: { backgroundColor: colors.primary.main + '20', borderColor: colors.primary.main },
  statChipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.text.muted },
  statChipTextActive: { color: colors.primary.main },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  ouContainer: { flexDirection: 'row', borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.default },
  ouButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: 3 },
  ouButtonOver: { backgroundColor: colors.semantic.success },
  ouButtonUnder: { backgroundColor: colors.semantic.danger },
  ouText: { fontSize: 11, fontWeight: '800' as any, color: colors.text.muted },
  ouTextActive: { color: '#000' },
  lineBox: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  lineInput: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary, textAlign: 'center', padding: 0 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonDisabled: { backgroundColor: colors.background.tertiary },
  addButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#000' },
});

// ── Main Builder Screen ─────────────────────────────────────────────────────

export default function BuilderScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ player: Player; imageUrl?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; imageUrl?: string } | null>(null);

  const { legs, removeLeg, clearParlay, hasPlayer } = useParlayBuilderStore();
  const addLegRaw = useParlayBuilderStore((s) => s.addLeg);
  const updateLeg = useParlayBuilderStore((s) => s.updateLeg);
  const { data: projections } = useProjections();

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await backendClient.get('/api/players/search', {
          params: { name: searchQuery },
          signal: controller.signal,
        });
        const results = (data.results ?? []).slice(0, 8).map((r: any) => {
          const match = projections?.find(
            (p) => p.playerName.toLowerCase() === `${r.firstname} ${r.lastname}`.toLowerCase()
          );
          return {
            player: {
              id: r.id,
              first_name: r.firstname,
              last_name: r.lastname,
              position: '',
              height: null, weight: null, jersey_number: null, college: null, country: null,
              draft_year: null, draft_round: null, draft_number: null,
              team: {
                id: 0, conference: '', division: '', city: '',
                name: match?.teamName ?? r.team ?? '',
                full_name: match?.teamName ?? r.team ?? '',
                abbreviation: match?.teamName?.slice(0, 3).toUpperCase() ?? '',
              },
            } as Player,
            imageUrl: r.headshotUrl ?? undefined,
          };
        });
        setSearchResults(results);
        setSearchError(null);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          setSearchResults([]);
          setSearchError('Search failed. Please try again.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, projections]);

  const handleSelectPlayer = useCallback((item: { player: Player; imageUrl?: string }) => {
    setSelectedPlayer(item);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
    analyticsService.track('Builder Player Selected', { playerId: item.player.id, playerName: `${item.player.first_name} ${item.player.last_name}` });
  }, []);

  const handleAddToParlay = useCallback((player: Player, statType: StatType, line: number, isOver: boolean, imageUrl?: string) => {
    addLegRaw(player, imageUrl);
    const store = useParlayBuilderStore.getState();
    const newLeg = store.legs[store.legs.length - 1];
    if (newLeg) {
      updateLeg(newLeg.id, { statType, line, isOver });
    }
    setSelectedPlayer(null);
    analyticsService.track('Builder Leg Added', { playerId: player.id, statType, line, isOver, totalLegs: store.legs.length });
  }, [addLegRaw, updateLeg]);

  const handleClearAll = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    clearParlay();
    setSelectedPlayer(null);
  }, [clearParlay]);

  const handleAnalyze = useCallback(() => {
    if (legs.length < 2) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    analyticsService.track('Builder Analyze Tapped', { legCount: legs.length });
    router.push('/parlay-analysis');
  }, [legs.length, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerCenter}>
            <View style={styles.vBadge}>
              <Image source={require('../../assets/animations/visbets-logo.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <Text style={styles.headerTitle}>Parlay Builder</Text>
          </View>
          {legs.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>Find Players</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a player..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            {isSearching && (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            )}

            {searchError && !isSearching && (
              <View style={styles.searchLoading}>
                <Ionicons name="warning-outline" size={16} color={colors.semantic.danger} />
                <Text style={[styles.searchLoadingText, { color: colors.semantic.danger }]}>{searchError}</Text>
              </View>
            )}

            {/* Search results dropdown — hide stale results while loading new ones */}
            {!isSearching && !searchError && searchResults.length > 0 && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.searchResults}>
                {searchResults.map((item) => {
                  const full = `${item.player.first_name} ${item.player.last_name}`;
                  return (
                    <TouchableOpacity
                      key={item.player.id}
                      style={styles.searchRow}
                      onPress={() => handleSelectPlayer(item)}
                    >
                      <View style={styles.searchAvatar}>
                        {item.imageUrl ? (
                          <ExpoImage source={{ uri: item.imageUrl }} style={styles.searchAvatarImg} contentFit="cover" />
                        ) : (
                          <Text style={styles.searchAvatarText}>{full.charAt(0)}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchName}>{full}</Text>
                        {item.player.team?.name ? <Text style={styles.searchTeam}>{item.player.team.name}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}

            {/* Selected player card */}
            {selectedPlayer && (
              <PlayerPropPreview
                player={selectedPlayer.player}
                projections={projections ?? []}
                imageUrl={selectedPlayer.imageUrl}
                onAdd={handleAddToParlay}
                isAdded={hasPlayer(selectedPlayer.player.id)}
              />
            )}
          </Animated.View>

          {/* Your Parlay */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Parlay</Text>
              {legs.length > 0 && (
                <View style={styles.legCountBadge}>
                  <Text style={styles.legCountText}>{legs.length} {legs.length === 1 ? 'leg' : 'legs'}</Text>
                </View>
              )}
            </View>

            {legs.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient colors={[colors.primary.main + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="layers-outline" size={40} color={colors.primary.main} />
                <Text style={styles.emptyTitle}>Start Building</Text>
                <Text style={styles.emptyText}>
                  Search for players above, review their predictions, then add picks to your parlay.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {legs.map((leg, i) => {
                  const full = `${leg.player.first_name} ${leg.player.last_name}`;
                  return (
                    <Animated.View key={leg.id} entering={FadeInUp.duration(300).delay(i * 50)} style={styles.legRow}>
                      <View style={[styles.ouBadge, { backgroundColor: leg.isOver ? colors.semantic.success + '20' : colors.semantic.danger + '20' }]}>
                        <Text style={[styles.ouBadgeText, { color: leg.isOver ? colors.semantic.success : colors.semantic.danger }]}>
                          {leg.isOver ? 'O' : 'U'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.legName} numberOfLines={1}>{full}</Text>
                        <Text style={styles.legDetail}>{leg.statType} {leg.isOver ? 'Over' : 'Under'} {leg.line}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeLeg(leg.id)} style={styles.removeLegBtn}>
                        <Ionicons name="close" size={16} color={colors.text.muted} />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Analyze Button */}
          {legs.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={{ marginBottom: spacing.lg }}>
              <TouchableOpacity
                style={[styles.analyzeButton, legs.length < 2 && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={legs.length < 2}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={legs.length >= 2 ? [colors.primary.main, colors.primary.main + 'CC'] : [colors.background.tertiary, colors.background.tertiary]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Ionicons name="analytics" size={22} color={legs.length >= 2 ? '#000' : colors.text.muted} />
                <Text style={[styles.analyzeText, legs.length < 2 && { color: colors.text.muted }]}>
                  {legs.length >= 2 ? `Analyze Parlay (${legs.length} legs)` : 'Add 2+ players to analyze'}
                </Text>
                {legs.length >= 2 && <Ionicons name="chevron-forward" size={20} color="#000" />}
              </TouchableOpacity>
              {legs.length >= 2 && (
                <Text style={styles.analyzeHint}>Risk assessment, correlation analysis, and hit probability</Text>
              )}
            </Animated.View>
          )}

          {/* Tips (empty state) */}
          {legs.length === 0 && !selectedPlayer && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Building Parlays</Text>
              {[
                'Search a player to see our model prediction + all book lines',
                'Pick OVER or UNDER, set your line, and add to parlay',
                'Add 2+ players then tap Analyze for risk vs payoff breakdown',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipNum}>{i + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.default,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerSpacer: { width: 72 },
  vBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary.main,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  clearButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.semantic.danger + '15', borderRadius: borderRadius.md,
  },
  clearText: { fontSize: typography.fontSize.sm, color: colors.semantic.danger, fontWeight: typography.fontWeight.semibold },
  scrollContent: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing.md },
  legCountBadge: { backgroundColor: colors.primary.main + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  legCountText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary.main },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border.default,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.base, color: colors.text.primary },
  searchLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  searchLoadingText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  searchResults: { marginTop: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  searchAvatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  searchAvatarImg: { width: 36, height: 36 },
  searchAvatarText: { fontSize: 14, fontWeight: '700' as any, color: colors.primary.main },
  searchName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary },
  searchTeam: { fontSize: typography.fontSize.xs, color: colors.text.muted, marginTop: 1 },
  emptyState: {
    alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.default,
    borderStyle: 'dashed', overflow: 'hidden', gap: spacing.sm,
  },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  legRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border.default,
  },
  ouBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  ouBadgeText: { fontSize: 14, fontWeight: '800' as any },
  legName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  legDetail: { fontSize: typography.fontSize.xs, color: colors.text.muted, marginTop: 2 },
  removeLegBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  analyzeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, gap: spacing.sm, overflow: 'hidden',
  },
  analyzeButtonDisabled: { opacity: 0.7 },
  analyzeText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#000' },
  analyzeHint: { fontSize: typography.fontSize.xs, color: colors.text.muted, textAlign: 'center', marginTop: spacing.sm },
  tipsCard: {
    backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border.default,
  },
  tipsTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  tipNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary.main + '20', textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: '800' as any, color: colors.primary.main },
  tipText: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 20 },
});
