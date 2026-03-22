/**
 * DataLoadingScreen
 * Full-screen all-black loading state with basketball Lottie + cycling phrases.
 * Drop-in replacement for ActivityIndicator loading states on data-heavy screens.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PHRASES = [
  'finding your edge...',
  'making sure we\'re sure...',
  'crunching the numbers...',
  'running the model...',
  'checking the lines...',
  'reading the tape...',
  'doing the math...',
  'analyzing the splits...',
];

const PHRASE_INTERVAL_MS = 2200;

export function DataLoadingScreen() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../../assets/Loader basketball.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      <Text style={styles.phrase}>{PHRASES[phraseIndex]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lottie: {
    width: 220,
    height: 220,
  },
  phrase: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
