# VisBets - NBA Player Props Analytics

A mobile NBA player-props analytics app that compares model projections to sportsbook lines, layering real NBA data, confidence signals, and player context into a clean, neon-futuristic "edge dashboard."

## Features

- **Real NBA Data**: Powered by Ball Don't Lie API (ALL ACCESS plan)
- **Player Props Board**: Browse today's player prop bets with projections, edges, and confidence scores
- **Player Detail Analytics**: Deep dive into player stats, trends, and risk factors
- **Subscription Tiers**: Free, VisPlus, and VisMax with premium feature gating
- **Neon-Futuristic UI**: Dark theme with glowing green accents and smooth animations

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Victory Native + React Native SVG
- **Styling**: StyleSheet + Expo LinearGradient
- **API**: Ball Don't Lie NBA API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (Mac) or Android Studio (for Android emulation)
- Expo Go app (for physical device testing)
- Ball Don't Lie API key

### Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Add your Ball Don't Lie API key to `.env`:
   ```
   EXPO_PUBLIC_BALL_DONT_LIE_API_KEY=your_api_key_here
   ```

   Get your API key from: https://balldontlie.io

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
visbets/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx           # Tab navigation setup
│   │   ├── index.tsx             # Board (main slate)
│   │   ├── visbets.tsx           # VisBets discovery feed
│   │   ├── parlays.tsx           # Parlays screen
│   │   └── profile.tsx           # Profile/subscription
│   ├── player/[id].tsx           # Player detail screen
│   ├── subscription.tsx          # Subscription upgrade
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx           # 404 screen
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── shared/               # Shared components (NeonCard, GlowText, etc.)
│   │   ├── board/                # Board-specific components
│   │   ├── player/               # Player detail components
│   │   └── parlays/              # Parlay components
│   ├── services/                 # API & business logic
│   │   ├── api/
│   │   │   ├── ballDontLie.ts    # API client + endpoints
│   │   │   └── types.ts          # API response types
│   │   ├── projections.ts        # Mock projection generator
│   │   └── calculations.ts       # Edge, volatility, confidence
│   ├── stores/                   # Zustand stores
│   │   └── subscriptionStore.ts  # User tier state
│   ├── hooks/                    # React Query hooks
│   │   ├── usePlayerProps.ts
│   │   ├── usePlayerStats.ts
│   │   ├── useSeasonAverages.ts
│   │   ├── usePlayer.ts
│   │   └── usePlayerInjuries.ts
│   ├── utils/                    # Helpers
│   │   ├── formatters.ts
│   │   └── constants.ts
│   └── theme/                    # Design system
│       ├── colors.ts
│       ├── typography.ts
│       └── styles.ts
└── assets/                       # Images, fonts
```

## Key Screens

### Board (Main Slate)
- Browse all available player props for today
- See projections, edges, and confidence scores
- Quick access to player details

### Player Detail
- Comprehensive analytics hub
- Season averages and recent game logs
- Premium features: trend charts, advanced splits, risk panels (gated by subscription)

### VisBets Discovery
- Curated list of top plays (Coming Soon)
- Top Edges Today
- Safest Plays
- High Upside Plays

### Parlays
- Suggested parlay combinations (Coming Soon)
- 2-leg, 3-leg, and 4-leg parlays

### Profile
- Subscription tier management
- Quick tier toggle for testing
- Settings (Coming Soon)

## Subscription Tiers

### Free
- Board access
- Player detail basics
- Projection vs line
- Last 5 games
- Basic trend chart

### VisPlus ($19.99/mo)
- Everything in Free
- Advanced splits
- Volatility & risk panels
- Top Edges feed
- Extended charts

### VisMax ($39.99/mo)
- Everything in VisPlus
- Matchup engine (Future)
- Parlay optimizer (Future)
- Real-time alerts (Future)
- Model explainers (Future)

## Data & Projections

### Real Data (Ball Don't Lie API)
- Player information
- Team details
- Game schedules
- Game logs and stats
- Season averages
- Player injuries
- **Player props odds** (real sportsbook lines!)

### Mock Projections (MVP)
Currently, projections are generated deterministically based on:
- Season averages
- Recent game trends (last 5 games)
- Player-specific variance (deterministic noise)
- Confidence score (inverse of stat variance)
- Volatility (coefficient of variation)
- Minutes risk (standard deviation of playing time)

**Future**: Replace with ML-based projections without refactoring UI.

## Testing Subscription Features

Use the Profile screen to toggle between subscription tiers:
1. Go to Profile tab
2. Under "Test Tiers (Development)", tap Free / VisPlus / VisMax
3. Navigate to Player Detail to see locked/unlocked features

## Development Notes

### API Key
The app expects `EXPO_PUBLIC_BALL_DONT_LIE_API_KEY` in your `.env` file. Without it, the app will show mock data for player props.

### Mock Data
If the Ball Don't Lie API is unavailable or returns an error, the app falls back to mock player props data for development.

### TypeScript
The project uses strict TypeScript. All API types are defined in `src/services/api/types.ts`.

### State Management
- **Zustand**: Subscription state (persisted to AsyncStorage)
- **React Query**: Server state caching with automatic refetching

### Styling
- Dark theme with neon green (#00FF88) as primary color
- Background: Near-black (#0A0A0B)
- Glow effects using text/box shadows
- All styles centralized in theme files

## Troubleshooting

### API not loading
- Check your `.env` file has the correct API key
- Verify the key with: `npx expo config --type public`
- Ball Don't Lie API may have rate limits

### Build errors
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `npx expo install --check`

### TypeScript errors
- Run type check: `npx tsc --noEmit`
- Regenerate types: Expo Router will auto-generate route types on start

## Future Enhancements

- [ ] Real ML projections (replace mock generator)
- [ ] User authentication
- [ ] Payment integration (Stripe/RevenueCat)
- [ ] Push notifications for line movements
- [ ] Parlay optimizer algorithm
- [ ] Live score tracking during games
- [ ] Historical accuracy tracking
- [ ] Social features (share plays)

## License

Private - All Rights Reserved

## Support

For issues or questions, please contact the development team.
