/**
 * Phone Verification Screen
 * Phone number input and OTP verification with Firebase
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/styles';
import { typography } from '../../src/theme/typography';
import { NeonButton } from '../../src/components/shared/NeonButton';
import {
  signInWithPhone,
  verifyPhoneCode,
} from '../../src/services/auth/authService';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type Step = 'phone' | 'otp';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  // Note: we set session directly (like email-verify / login) instead of calling
  // initialize(), which resets isLoading and can flash the splash screen.

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | undefined>();

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const phoneInputRef = useRef<TextInput>(null);

  // Clear pending verification on unmount
  useEffect(() => {
    return () => {
      // no-op (Supabase handles session internally)
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format phone as user types
  const formatPhoneInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '';

    if (digits.length > 0) {
      formatted = '(' + digits.slice(0, 3);
    }
    if (digits.length > 3) {
      formatted += ') ' + digits.slice(3, 6);
    }
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 10);
    }

    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(formatPhoneInput(text));
      setError(undefined);
    }
  };

  const handleSendCode = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const fullPhone = `+1${digits}`;
      const { error } = await signInWithPhone(fullPhone);

      if (error) {
        setError(error.message);
      } else {
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN);
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(undefined);

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) return;

    setLoading(true);
    setError(undefined);

    try {
      const digits = phoneNumber.replace(/\D/g, '');
      const fullPhone = digits ? `+1${digits}` : '';
      const { session, error } = await verifyPhoneCode(fullPhone, otpCode);

      if (error) {
        setError(error.message);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else if (session) {
        // The Supabase auth listener (setupAuthListener in _layout.tsx) will
        // fire automatically, fetch the profile, and set user+session together.
        // Do NOT set session here without user — it triggers the auth guard
        // with user=null, which incorrectly routes to onboarding for returning
        // users before the listener has fetched their profile.
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    const digits = phoneNumber.replace(/\D/g, '');
    const fullPhone = `+1${digits}`;

    setLoading(true);
    try {
      const { error } = await signInWithPhone(fullPhone);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setResendCooldown(RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(''));
        Alert.alert('Code Sent', 'A new verification code has been sent.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      // no-op (Supabase handles session internally)
      setStep('phone');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError(undefined);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              {/* Phone Number Input */}
              <View style={styles.header}>
                <Text style={styles.title}>Enter your phone</Text>
                <Text style={styles.subtitle}>
                  We'll send you a verification code
                </Text>
              </View>

              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCode}>+1</Text>
                  <Text style={styles.countryLabel}>US</Text>
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="(555) 555-5555"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  autoFocus
                  selectionColor={colors.primary.main}
                />
              </View>
              <Text style={styles.usOnlyHint}>Only US phone numbers are supported during beta</Text>

              {error && <Text style={styles.error}>{error}</Text>}

              <NeonButton
                title="Send Code"
                onPress={handleSendCode}
                loading={loading}
                disabled={phoneNumber.replace(/\D/g, '').length !== 10}
                style={styles.button}
              />
            </>
          ) : (
            <>
              {/* OTP Verification */}
              <View style={styles.header}>
                <Text style={styles.title}>Verify your phone</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.phone}>+1 {phoneNumber}</Text>
                </Text>
              </View>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    selectionColor={colors.primary.main}
                  />
                ))}
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <NeonButton
                title="Verify"
                onPress={() => handleVerify()}
                loading={loading}
                disabled={otp.join('').length !== OTP_LENGTH}
                style={styles.button}
              />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || loading}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      (resendCooldown > 0 || loading) && styles.resendLinkDisabled,
                    ]}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Legal Links — Required by Apple Guideline 5.1.1 */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>By signing in you agree to our{' '}</Text>
          <TouchableOpacity
            onPress={() => router.push('/terms-of-service')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>{' '}and{' '}</Text>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  phone: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold as any,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  countryCodeBox: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  countryCode: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  countryLabel: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 1,
  },
  usOnlyHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontStyle: 'italic' as const,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    paddingVertical: spacing.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputError: {
    borderColor: colors.semantic.danger,
  },
  error: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold as any,
  },
  resendLinkDisabled: {
    color: colors.text.muted,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  legalText: {
    fontSize: 11,
    color: colors.text.muted,
    lineHeight: 16,
  },
  legalLink: {
    fontSize: 11,
    color: colors.primary.main,
    textDecorationLine: 'underline' as const,
    lineHeight: 16,
  },
});
