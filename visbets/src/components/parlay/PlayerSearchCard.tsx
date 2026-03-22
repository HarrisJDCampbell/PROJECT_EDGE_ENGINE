/**
 * PlayerSearchCard
 * Horizontal card showing player search result
 * Full width, with player image on left, info in middle, add button on right
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Player } from '../../services/api/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { getInitials } from '../../utils/formatters';

interface PlayerSearchCardProps {
  player: Player;
  onAdd: (player: Player, imageUrl?: string) => void;
  isAdded?: boolean;
}

/**
 * NBA CDN player ID mapping for common players
 */
const NBA_PLAYER_IDS: Record<string, number> = {
  'lebron james': 2544,
  'stephen curry': 201939,
  'kevin durant': 201142,
  'giannis antetokounmpo': 203507,
  'nikola jokic': 203999,
  'luka doncic': 1629029,
  'jayson tatum': 1628369,
  'joel embiid': 203954,
  'damian lillard': 203081,
  'anthony davis': 203076,
  'devin booker': 1626164,
  'jimmy butler': 202710,
  'ja morant': 1629630,
  'trae young': 1629027,
  'donovan mitchell': 1628378,
  'kyrie irving': 202681,
  'paul george': 202331,
  'kawhi leonard': 202695,
  'zion williamson': 1629627,
  'shai gilgeous-alexander': 1628983,
  'anthony edwards': 1630162,
  'de\'aaron fox': 1628368,
  'jaylen brown': 1627759,
  'bam adebayo': 1628389,
  'lauri markkanen': 1628374,
  'tyrese haliburton': 1630169,
  'pascal siakam': 1627783,
  'desmond bane': 1630217,
  'chet holmgren': 1631096,
  'victor wembanyama': 1641705,
  'paolo banchero': 1631094,
  'tyrese maxey': 1630178,
  'darius garland': 1629636,
  'lamelo ball': 1630163,
  'julius randle': 203944,
  'brandon ingram': 1627742,
  'cade cunningham': 1630595,
  'jalen brunson': 1628973,
  'fred vanvleet': 1627832,
  'dejounte murray': 1627749,
  'alperen sengun': 1630578,
  'scottie barnes': 1630567,
  'evan mobley': 1630596,
  'franz wagner': 1630532,
  'mikal bridges': 1628969,
  'austin reaves': 1630559,
  'tyler herro': 1629639,
  'trey murphy': 1630530,
};

function getPlayerImageUrl(playerName: string): string {
  const nameLower = playerName.toLowerCase();
  const nbaPlayerId = NBA_PLAYER_IDS[nameLower];
  if (nbaPlayerId) {
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaPlayerId}.png`;
  }

  const lastName = nameLower.split(' ').pop() || '';
  for (const [name, id] of Object.entries(NBA_PLAYER_IDS)) {
    if (name.includes(lastName) && lastName.length > 3) {
      return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
    }
  }

  return '';
}

export function PlayerSearchCard({ player, onAdd, isAdded = false }: PlayerSearchCardProps) {
  const [imageError, setImageError] = useState(false);
  const fullName = `${player.first_name} ${player.last_name}`;
  const imageUrl = getPlayerImageUrl(fullName);

  const handleAdd = () => {
    if (isAdded) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onAdd(player, imageUrl || undefined);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isAdded && styles.containerAdded]}
      onPress={handleAdd}
      activeOpacity={0.7}
      disabled={isAdded}
    >
      {/* Player Image */}
      <View style={styles.imageContainer}>
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
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

      {/* Player Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.playerName} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.detailsRow}>
          {player.team?.abbreviation ? (
            <>
              <Text style={styles.teamText}>{player.team.abbreviation}</Text>
              {player.position ? <View style={styles.dot} /> : null}
            </>
          ) : null}
          <Text style={styles.positionText}>
            {player.position || (player.team?.abbreviation ? '' : 'NBA')}
          </Text>
          {player.jersey_number ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.jerseyText}>#{player.jersey_number}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, isAdded && styles.addButtonAdded]}
        onPress={handleAdd}
        disabled={isAdded}
      >
        <Ionicons
          name={isAdded ? 'checkmark' : 'add'}
          size={24}
          color={isAdded ? colors.text.muted : colors.primary.main}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  containerAdded: {
    opacity: 0.6,
    borderColor: colors.primary.main + '50',
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.main,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  positionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  jerseyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  addButtonAdded: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.default,
  },
});
