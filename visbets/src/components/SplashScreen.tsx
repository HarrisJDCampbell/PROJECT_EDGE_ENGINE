/**
 * SplashScreen Component
 * Shows VisBets logo with Lottie animation while app loads
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  showError?: boolean;
  errorMessage?: string;
  errorSubtext?: string;
}

export function SplashScreen({
  showError = false,
  errorMessage = 'Connection timed out',
  errorSubtext = 'Please check your internet connection and restart the app'
}: SplashScreenProps) {
  return (
    <View style={styles.container}>
      {/* Logo Image - Same position as sign in page */}
      <Animated.View
        entering={FadeIn.duration(800)}
        style={styles.logoContainer}
      >
        <Image
          source={require('../../assets/animations/visbets-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {showError ? (
        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.errorSubtext}>{errorSubtext}</Text>
        </Animated.View>
      ) : (
        /* Lottie Animation */
        <Animated.View
          entering={FadeIn.duration(500).delay(400)}
          style={styles.animationContainer}
        >
          <LottieView
            source={require('../../assets/Loader basketball.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.15,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: height * 0.35,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
  },
  animationContainer: {
    width: width * 0.5,
    height: width * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.1,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.semantic?.danger || '#FF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.text?.secondary || '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
