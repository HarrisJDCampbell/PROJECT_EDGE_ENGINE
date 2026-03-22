# VisBets Player Detail Screen — MVP Implementation Plan

## Current State Analysis ✅

You already have:
- ✅ **Ball Don't Lie API integration** - Full client in `ballDontLie.ts`
- ✅ **Real sportsbook lines** - `getPlayerProps()` endpoint returns actual odds
- ✅ **Projection engine** - `generateProjection()` creates data-driven projections
- ✅ **Edge calculations** - Confidence, volatility, minutes risk all working
- ✅ **React Query hooks** - Data fetching infrastructure ready
- ✅ **Victory Native** - Chart library installed
- ✅ **Design system** - Colors, typography, NeonCard, GlowText

## What Ball Don't Lie Gives Us (Real Data)

### Available Endpoints:
1. **`/nba/v2/odds/player_props`** - 🔥 REAL sportsbook lines (DraftKings, FanDuel, BetMGM, etc.)
2. **`/nba/v1/stats`** - Player game logs (recent performance)
3. **`/nba/v1/season_averages`** - Season stats
4. **`/nba/v1/players/{id}`** - Player details
5. **`/nba/v1/player_injuries`** - Injury status

### What We DON'T Get (Need to Calculate):
- ❌ Projections (we generate these in `projections.ts`)
- ❌ Edge calculations (we calculate: projection - line)
- ❌ Confidence scores (we derive from game variance)
- ❌ Volatility (we calculate from CV)
- ❌ Matchup data (premium feature - can add later)

## MVP Implementation Path (10 Components)

### **Phase 1: Core Hero Components** (Priority 1 - Must Ship)

#### 1. TypeScript Interfaces First
**File:** `src/components/player/types.ts`

Define all prop interfaces so components are type-safe from the start.

**Time:** 30 minutes
**Complexity:** Low

---

#### 2. ProjectionVsLinesCard ⭐ MOST CRITICAL
**File:** `src/components/player/ProjectionVsLinesCard.tsx`

**Data Source:**
- **Projection:** `generateProjection()` using real game logs
- **Book Lines:** `getPlayerProps()` - real sportsbook data from Ball Don't Lie

**Props:**
```typescript
{
  statType: 'PTS' | 'REB' | 'AST',
  visProjection: number,        // from projections.ts
  books: [{
    name: 'DraftKings',         // from PlayerProp.sportsbook
    line: number                // from PlayerProp.line
  }]
}
```

**Layout:**
```
┌──────────────────────────────┐
│   VIS PROJECTION: 24.8       │
│                              │
│  DraftKings    FanDuel       │
│     23.5         22.5        │
│  +1.3 EDGE    +2.3 EDGE      │
└──────────────────────────────┘
```

**Time:** 2 hours
**Complexity:** Medium

---

#### 3. StatSelectorChips
**File:** `src/components/player/StatSelectorChips.tsx`

**Data Source:** Static stat types

**Behavior:**
- User taps "PTS" → entire screen re-renders with points projections
- Triggers refetch of projections for selected stat

**Time:** 1 hour
**Complexity:** Low

---

#### 4. ConfidenceRiskBar
**File:** `src/components/player/ConfidenceRiskBar.tsx`

**Data Source:**
- **Confidence:** `projection.confidence` (calculated from game logs)
- **Volatility:** `projection.volatility` (calculated CV)
- **Minutes Risk:** `projection.minutes_risk` (calculated from minute variance)

**Layout:** 3 compact modules side-by-side

**Time:** 1.5 hours
**Complexity:** Low-Medium

---

### **Phase 2: Analytics Components** (Priority 2 - Core Features)

#### 5. RollingAverageTiles
**File:** `src/components/player/RollingAverageTiles.tsx`

**Data Source:**
- **Last 5 avg:** `calculateRecentTrend(recentGames, statKey, 5)`
- **Last 10 avg:** `calculateRecentTrend(recentGames, statKey, 10)`
- **Season avg:** `seasonAverage[statKey]`

**Layout:** 3-column grid of circular tiles

**Time:** 1 hour
**Complexity:** Low

---

#### 6. GameLogCarousel
**File:** `src/components/player/GameLogCarousel.tsx`

**Data Source:**
- **Recent games:** `usePlayerStats(playerId)` - returns `GameStats[]` from Ball Don't Lie

**Each card shows:**
```
@LAL | 36 min | 28 pts
███████░░ (spark bar)
```

**Time:** 2 hours
**Complexity:** Medium (horizontal scroll + cards)

---

#### 7. TrendLineCard
**File:** `src/components/player/TrendLineCard.tsx`

**Data Source:**
- **Game values:** Map `recentGames` to Victory Native data points
- **Projection line:** Static horizontal line at projection value
- **Book line:** Static horizontal line at book value

**Victory Native Setup:**
```typescript
import { CartesianChart, Line } from 'victory-native';

// Chart shows last 10 games + projection + line
```

**Time:** 3 hours
**Complexity:** High (Victory Native integration)

---

### **Phase 3: Polish & CTA** (Priority 3 - Ship It)

#### 8. ActionFooter
**File:** `src/components/player/ActionFooter.tsx`

**Behavior:**
- "Add to Slip" → Calls `useSlipStore().addSelection()`
- "Compare Books" → Navigate to book comparison modal

**Layout:** Sticky footer with 2 buttons

**Time:** 1 hour
**Complexity:** Low

---

#### 9. Refactor Player Detail Screen
**File:** `app/player/[id].tsx`

**Current:** Basic layout with mock data
**New:** Compose all new components together

**State Management:**
```typescript
const [selectedStat, setSelectedStat] = useState<StatType>('PTS');

// Fetch data for selected stat
const { data: projection } = useProjection(playerId, selectedStat);
const { data: bookLines } = usePlayerProps(playerId, selectedStat);
```

**Time:** 2 hours
**Complexity:** Medium

---

#### 10. Testing & Polish
- Test stat switching
- Test with multiple players
- Ensure all API data flows correctly
- Performance optimization

**Time:** 2 hours
**Complexity:** Medium

---

## Total MVP Timeline

| Phase | Components | Time Estimate |
|-------|-----------|---------------|
| Phase 1 | Interfaces + Hero (4 items) | ~5 hours |
| Phase 2 | Analytics (3 items) | ~6 hours |
| Phase 3 | Polish + Refactor (3 items) | ~5 hours |
| **Total** | **10 items** | **~16 hours** |

**Realistic delivery:** 2-3 days of focused work

---

## Data Flow Example (How It Works)

### User Flow:
1. User navigates to `/player/237` (LeBron)
2. Screen loads with `selectedStat = 'PTS'`

### API Calls:
```typescript
// Fetch player data
const player = await getPlayer(237);

// Fetch recent games
const recentGames = await getPlayerStats(237, { season: 2024 });

// Fetch season average
const seasonAvg = await getSeasonAverages(237, 2024);

// Fetch sportsbook lines
const props = await getPlayerProps(); // Real odds from Ball Don't Lie
const ptsProps = props.filter(p => p.player_id === 237 && p.stat_type === 'PTS');

// Generate projection
const projection = generateProjection(player, 'PTS', seasonAvg, recentGames);

// Calculate edge for each book
const edges = ptsProps.map(prop => ({
  book: prop.sportsbook,
  line: prop.line,
  edge: projection.projected_value - prop.line
}));
```

### Render:
```typescript
<ProjectionVsLinesCard
  statType="PTS"
  visProjection={24.8}
  books={[
    { name: 'DraftKings', line: 23.5 },  // edge: +1.3
    { name: 'FanDuel', line: 22.5 }      // edge: +2.3
  ]}
/>
```

---

## Components We're NOT Building (For Later)

### Deferred to Post-MVP:
- ❌ SplitsAccordion (Home/Away/Last X) - Not critical for launch
- ❌ MatchupRadarCard (Premium) - Need more data sources
- ❌ EnsembleSummaryCard - Advanced feature
- ❌ BookComparisonHalf (individual book displays) - Can inline in hero for MVP

**Why defer these?**
- We can ship a valuable product without them
- They require additional data sources or premium logic
- Focus on core decision-making features first

---

## MVP Component Priority (What to Build First)

### Critical Path (Must Ship):
1. ✅ **types.ts** - All interfaces
2. ✅ **ProjectionVsLinesCard** - Hero component
3. ✅ **StatSelectorChips** - Stat switching
4. ✅ **ConfidenceRiskBar** - Trust signals
5. ✅ **RollingAverageTiles** - Quick validation
6. ✅ **ActionFooter** - CTA

### Nice to Have (Add if time):
7. ⭐ **GameLogCarousel** - Recent performance proof
8. ⭐ **TrendLineCard** - Visual trend confirmation

---

## Recommended Starting Point

**Start here:** Create `src/components/player/types.ts`

This file will define all TypeScript interfaces for components. Once types are locked in, building components becomes straightforward.

**Next:** Build `ProjectionVsLinesCard` - the hero component. Once this works, everything else falls into place.

---

## Questions for You

1. **Stat Types:** Do you want to support PRA (Points + Rebounds + Assists) in MVP, or just individual stats?
2. **Book Display:** Should we show all available books, or just top 2 (best lines)?
3. **Stat Switching:** Should switching stats refetch data, or use cached values?
4. **Premium Features:** Do you want to gate any of these components behind subscription, or make everything free for MVP?

---

**Ready to start building?**

Recommended next step: **Create the types.ts file** with all component interfaces.

This will give you:
- ✅ Type safety from day 1
- ✅ Clear component contracts
- ✅ Easy to parallelize component development
- ✅ Self-documenting prop APIs

Let me know when you're ready and I'll create the types file!
