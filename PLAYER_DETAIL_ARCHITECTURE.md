# VisBets Player Detail Screen — Component Architecture

## Design Philosophy
- **Trading terminal** meets **casino-grade UI** meets **sports analytics**
- Decision first, evidence second, advanced context last
- Modular, rounded, glowing, scannable
- 100% stat-agnostic and reusable

---

## Component Tree (Visual Hierarchy)

```
PlayerDetailScreen (app/player/[id].tsx)
│
├─ StatSelectorChips ──────────── Stat switcher (PTS | REB | AST | PRA | ALL)
│
├─ ProjectionVsLinesCard ──────── ⭐ HERO COMPONENT
│   ├─ BookComparisonHalf (PrizePicks)
│   └─ BookComparisonHalf (DraftKings)
│
├─ ConfidenceRiskBar ──────────── Thin horizontal strip
│   ├─ ConfidenceMeter (existing)
│   ├─ VolatilityIndicator
│   └─ MinutesRiskIndicator
│
├─ TrendLineCard ──────────────── Victory Native chart
│   └─ TrendBadge (Trending Up/Flat/Down)
│
├─ RollingAverageTiles ─────────── 3-column grid
│   └─ RollingAvgTile (L5, L10, Season)
│
├─ GameLogCarousel ─────────────── Horizontal scroll
│   └─ GameLogCard (individual game)
│
├─ SplitsAccordion ─────────────── Expandable sections
│   ├─ SplitCard (Home/Away)
│   ├─ SplitCard (Last 5/10/20)
│   └─ SplitCard (vs Opponent) [Premium 🔒]
│
├─ MatchupRadarCard ────────────── [Premium] Radar chart
│   └─ PremiumGate (existing)
│
├─ EnsembleSummaryCard ─────────── Ensemble projection + range
│   └─ ConfidenceBandVisualization
│
└─ ActionFooter ────────────────── Sticky bottom CTA
    ├─ AddToSlipButton
    └─ CompareBooksButton
```

---

## File Structure

```
src/components/
│
├─ player/                          ← NEW: Player detail specific components
│   ├─ ProjectionVsLinesCard.tsx    ⭐ Hero component (MOST IMPORTANT)
│   ├─ BookComparisonHalf.tsx       Individual book display (PrizePicks/DraftKings)
│   ├─ StatSelectorChips.tsx        Stat type switcher
│   ├─ ConfidenceRiskBar.tsx        3-part risk strip
│   ├─ TrendLineCard.tsx            Victory Native chart wrapper
│   ├─ TrendBadge.tsx               Trending Up/Down indicator
│   ├─ RollingAverageTiles.tsx      3-column avg grid
│   ├─ RollingAvgTile.tsx           Single avg tile
│   ├─ GameLogCarousel.tsx          Horizontal scroll recent games
│   ├─ GameLogCard.tsx              Individual game card
│   ├─ SplitsAccordion.tsx          Expandable splits sections
│   ├─ SplitCard.tsx                Individual split display
│   ├─ MatchupRadarCard.tsx         Premium radar chart
│   ├─ EnsembleSummaryCard.tsx      Ensemble projection summary
│   ├─ ConfidenceBandVisualization.tsx  Range visualization
│   └─ ActionFooter.tsx             Sticky CTA footer
│
├─ shared/                          ← Existing reusable primitives
│   ├─ NeonCard.tsx                 ✅ Already exists
│   ├─ GlowText.tsx                 ✅ Already exists
│   ├─ ConfidenceMeter.tsx          ✅ Already exists
│   ├─ EdgeBadge.tsx                ✅ Already exists
│   ├─ RiskIndicator.tsx            ✅ Already exists
│   ├─ PremiumGate.tsx              ✅ Already exists
│   └─ LockedInsight.tsx            ✅ Already exists (from PlayerPropCard)
│
└─ board/                           ← Existing board components
    └─ PlayerPropCard.tsx           ✅ Already exists
```

---

## Component Specifications

### 1. **ProjectionVsLinesCard** ⭐ HERO
**Path:** `src/components/player/ProjectionVsLinesCard.tsx`

**Purpose:** The single most important component. Shows VisBets projection vs multiple sportsbook lines.

**Layout:**
```
┌─────────────────────────────────────┐
│     VIS PROJECTION: 24.8            │
│                                     │
│  PrizePicks        DraftKings       │
│     23.5               22.5         │
│   +1.3 EDGE         +2.3 EDGE       │
└─────────────────────────────────────┘
```

**Props Interface:**
```typescript
interface ProjectionVsLinesCardProps {
  statType: 'PTS' | 'REB' | 'AST' | 'PRA' | 'BLK' | 'STL' | '3PM';
  visProjection: number;
  books: {
    name: 'PrizePicks' | 'DraftKings' | 'Underdog' | 'Sleeper';
    line: number;
  }[];
  onBookSelect?: (bookName: string) => void;
}
```

**Reusability:**
- ✅ Can be used in player detail
- ✅ Can be used in parlay preview
- ✅ Can be used in quick view modals
- ✅ Stat-agnostic (works for any prop type)

---

### 2. **StatSelectorChips**
**Path:** `src/components/player/StatSelectorChips.tsx`

**Purpose:** Horizontal segmented control for switching stat types.

**Props Interface:**
```typescript
interface StatSelectorChipsProps {
  availableStats: ('PTS' | 'REB' | 'AST' | 'PRA' | 'ALL')[];
  selectedStat: 'PTS' | 'REB' | 'AST' | 'PRA' | 'ALL';
  onStatChange: (stat: string) => void;
}
```

**Visual:**
- Pills with neon green glow on selection
- Smooth animation on switch
- Triggers all downstream data updates

---

### 3. **ConfidenceRiskBar**
**Path:** `src/components/player/ConfidenceRiskBar.tsx`

**Purpose:** Compact 3-module strip showing confidence, volatility, minutes risk.

**Props Interface:**
```typescript
interface ConfidenceRiskBarProps {
  confidence: number;           // 0-100
  volatility: 'Low' | 'Medium' | 'High';
  minutesRisk: 'Low' | 'Medium' | 'High';
  onInfoPress?: (type: 'confidence' | 'volatility' | 'minutes') => void;
}
```

**Modules:**
- Left: Circular gauge (confidence %)
- Center: Wave icon + volatility level
- Right: Clock icon + minutes risk

---

### 4. **TrendLineCard**
**Path:** `src/components/player/TrendLineCard.tsx`

**Purpose:** Victory Native line chart showing recent performance trend.

**Props Interface:**
```typescript
interface TrendLineCardProps {
  statType: string;
  games: {
    gameNumber: number;
    value: number;
    opponent?: string;
  }[];
  projection: number;
  bookLine: number;
  trendDirection?: 'up' | 'down' | 'flat';
}
```

**Chart Elements:**
- Green line: Player actuals
- Dashed line: Projection
- Thin flat line: Book line
- Badge: "Trending Up" etc.

---

### 5. **RollingAverageTiles**
**Path:** `src/components/player/RollingAverageTiles.tsx`

**Purpose:** 3-column grid showing L5, L10, Season averages.

**Props Interface:**
```typescript
interface RollingAverageTilesProps {
  statType: string;
  last5Avg: number;
  last10Avg: number;
  seasonAvg: number;
  bookLine: number;  // For comparison tick marks
}
```

**Visual:**
- Green tick icon if avg > line
- Circular-rectangle tiles
- Soft glow on values

---

### 6. **GameLogCarousel**
**Path:** `src/components/player/GameLogCarousel.tsx`

**Purpose:** Horizontal scroll of recent games (NO TABLES).

**Props Interface:**
```typescript
interface GameLogCarouselProps {
  statType: string;
  games: {
    opponent: string;
    minutes: number;
    statValue: number;
    gameDate?: string;
  }[];
}
```

**Each Card Shows:**
```
@LAL | 36 min | 28 pts
███████░░
```

---

### 7. **SplitsAccordion**
**Path:** `src/components/player/SplitsAccordion.tsx`

**Purpose:** Expandable sections for Home/Away, Last X, vs Opponent splits.

**Props Interface:**
```typescript
interface SplitsAccordionProps {
  statType: string;
  splits: {
    home: number;
    away: number;
    last5: number;
    last10: number;
    last20: number;
    vsOpponent?: number;  // Premium
  };
  bookLine: number;
  isPremium: boolean;
}
```

**Behavior:**
- Collapsed by default
- Premium splits visible but locked 🔒
- Shows delta vs book line with arrows

---

### 8. **MatchupRadarCard**
**Path:** `src/components/player/MatchupRadarCard.tsx`

**Purpose:** Premium radar chart for opponent defense vs position.

**Props Interface:**
```typescript
interface MatchupRadarCardProps {
  opponentDefense: {
    vsPosition: number;  // 0-100
    pace: number;
    blowoutRisk: 'Low' | 'Medium' | 'High';
  };
  isPremium: boolean;
}
```

**Chart Axes:**
- Opp Defense vs Position
- Pace
- Blowout Risk

---

### 9. **EnsembleSummaryCard**
**Path:** `src/components/player/EnsembleSummaryCard.tsx`

**Purpose:** Show ensemble projection with confidence band.

**Props Interface:**
```typescript
interface EnsembleSummaryCardProps {
  statType: string;
  ensembleProjection: number;
  floor: number;
  ceiling: number;
  confidenceBand: number;  // percentage
}
```

**Visual:**
- Central projection (big number)
- Range bar showing floor → ceiling
- Confidence band visualization

---

### 10. **ActionFooter**
**Path:** `src/components/player/ActionFooter.tsx`

**Purpose:** Sticky bottom CTA for adding to slip or comparing books.

**Props Interface:**
```typescript
interface ActionFooterProps {
  playerId: number;
  statType: string;
  projection: number;
  line: number;
  onAddToSlip: () => void;
  onCompareBooks: () => void;
}
```

**Buttons:**
- Primary: "Add to Slip" (big, green glow)
- Secondary: "Compare Books" (outline)

---

## Reusability Matrix

| Component | Player Detail | Parlay Preview | Quick View | Future Sports |
|-----------|---------------|----------------|------------|---------------|
| ProjectionVsLinesCard | ✅ | ✅ | ✅ | ✅ |
| StatSelectorChips | ✅ | ✅ | ✅ | ✅ |
| ConfidenceRiskBar | ✅ | ✅ | ❌ | ✅ |
| TrendLineCard | ✅ | ❌ | ❌ | ✅ |
| RollingAverageTiles | ✅ | ❌ | ✅ | ✅ |
| GameLogCarousel | ✅ | ❌ | ✅ | ✅ |
| SplitsAccordion | ✅ | ❌ | ❌ | ✅ |
| MatchupRadarCard | ✅ | ✅ | ❌ | ✅ |
| EnsembleSummaryCard | ✅ | ✅ | ✅ | ✅ |
| ActionFooter | ✅ | ✅ | ✅ | ✅ |

---

## Data Flow Architecture

```typescript
// Player Detail Screen State
interface PlayerDetailState {
  playerId: number;
  selectedStat: StatType;

  // Derived from hooks
  player: Player;
  projections: ProjectionData;
  recentGames: GameStats[];
  seasonAvg: SeasonAverage;
  splits: SplitsData;
  bookLines: BookLine[];
}

// Stat switching triggers:
// 1. StatSelectorChips emits new stat
// 2. Screen updates selectedStat
// 3. All components re-render with new stat data
```

---

## Implementation Priority (Recommended Order)

### **Phase 1: Hero Components** (Week 1)
1. ✅ ProjectionVsLinesCard (MOST IMPORTANT)
2. ✅ StatSelectorChips
3. ✅ ConfidenceRiskBar

### **Phase 2: Core Analytics** (Week 1-2)
4. ✅ TrendLineCard (Victory Native integration)
5. ✅ RollingAverageTiles
6. ✅ GameLogCarousel

### **Phase 3: Advanced Features** (Week 2)
7. ✅ SplitsAccordion
8. ✅ EnsembleSummaryCard
9. ✅ ActionFooter

### **Phase 4: Premium Features** (Week 3)
10. ✅ MatchupRadarCard
11. Premium integration throughout

---

## Next Steps

1. **Create component interfaces file:**
   - `src/components/player/types.ts`
   - Define all prop interfaces

2. **Set up Victory Native chart config:**
   - Theme matching VisBets design
   - Reusable chart styles

3. **Create mock data generators:**
   - `src/services/mockPlayerDetail.ts`
   - Generate realistic data for all components

4. **Implement components in priority order**

---

## Questions to Resolve

1. **Book line data source:**
   - Do we have a multi-book API endpoint?
   - Or should we mock PrizePicks, DraftKings, Underdog for now?

2. **Ensemble projection calculation:**
   - Should this be client-side or server-side?
   - What models feed into the ensemble?

3. **Stat switching behavior:**
   - Should it refetch data or use cached values?
   - Debounce rapid switches?

4. **Premium feature gates:**
   - Which specific splits are premium?
   - Is matchup radar always premium or conditionally?

---

**Ready to proceed with implementation?**

Choose:
- **Option A:** Start with ProjectionVsLinesCard (hero component)
- **Option B:** Create all TypeScript interfaces first
- **Option C:** Set up mock data generators first
