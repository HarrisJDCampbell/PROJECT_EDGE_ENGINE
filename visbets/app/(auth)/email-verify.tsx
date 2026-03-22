import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/styles';
import { typography } from '../../src/theme/typography';
import { NeonButton } from '../../src/components/shared/NeonButton';
import { signInWithEmailOtp, verifyEmailOtp } from '../../src/services/auth/authService';
const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

type Step = 'email' | 'waiting';

export default function EmailVerifyScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSendLink = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { error } = await signInWithEmailOtp(email.trim().toLowerCase());
      if (error) {
        setError(error.message);
      } else {
        setStep('waiting');
        setResendCooldown(RESEND_COOLDOWN);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send link');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await signInWithEmailOtp(email.trim().toLowerCase());
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setResendCooldown(RESEND_COOLDOWN);
        Alert.alert('Link Sent', 'A new sign-in link has been sent to your email.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = otpCode.trim();
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    setError(undefined);
    try {
      const { user, session, error } = await verifyEmailOtp(email.trim().toLowerCase(), code);
      if (error) {
        setError(error.message);
        setOtpCode('');
      } else if (session) {
        // The Supabase auth listener (setupAuthListener in _layout.tsx) will
        // fire automatically, fetch the profile, and set user+session together.
        // Do NOT set session here without user — it triggers the auth guard
        // with user=null, which incorrectly routes to onboarding for returning
        // users before the listener has fetched their profile.
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'waiting') {
      setStep('email');
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.content}>
          {step === 'email' ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Enter your email</Text>
                <Text style={styles.subtitle}>We'll send you a magic link to sign in — no password needed</Text>
              </View>

              <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.emailInput}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(undefined); }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  selectionColor={colors.primary.main}
                  onSubmitEditing={handleSendLink}
                  returnKeyType="send"
                />
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <NeonButton
                title="Send Link"
                onPress={handleSendLink}
                loading={loading}
                disabled={!isValidEmail(email)}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.mailIconContainer}>
                  <Ionicons name="mail-open-outline" size={48} color={colors.primary.main} />
                </View>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                  We sent a sign-in link to{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {'\n\n'}Tap the link in your email to sign in. You'll be redirected back to VisBets automatically.
                </Text>
              </View>

              <View style={styles.waitingIndicator}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.waitingText}>Waiting for sign in...</Text>
              </View>

              {/* Manual OTP fallback */}
              <Text style={styles.otpLabel}>Or enter the 6-digit code from the email:</Text>
              <View style={styles.otpRow}>
                <TextInput
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={(t) => { setOtpCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH)); setError(undefined); }}
                  placeholder="000000"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  selectionColor={colors.primary.main}
                />
                <NeonButton
                  title="Verify"
                  onPress={handleVerifyCode}
                  loading={loading}
                  disabled={otpCode.length !== OTP_LENGTH}
                  style={styles.otpVerifyButton}
                />
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't get it?</Text>
                <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading}>
                  <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && styles.resendLinkDisabled]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.tryDifferentButton} onPress={handleBack}>
                <Text style={styles.tryDifferentText}>Use a different email</Text>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background.primary },
  keyboardView: { flex: 1 },
  backButton: { padding: spacing.lg },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  header: { marginBottom: spacing['2xl'] },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: typography.fontSize.base, color: colors.text.secondary, lineHeight: 24 },
  emailHighlight: { color: colors.primary.main, fontWeight: typography.fontWeight.semibold as any },
  mailIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputError: { borderColor: colors.semantic.danger },
  inputIcon: { marginRight: spacing.sm },
  emailInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing.lg,
  },
  error: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: { marginTop: spacing.md },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  waitingText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium as any,
  },
  otpLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  otpVerifyButton: {
    minWidth: 90,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  resendText: { fontSize: typography.fontSize.sm, color: colors.text.muted },
  resendLink: { fontSize: typography.fontSize.sm, color: colors.primary.main, fontWeight: typography.fontWeight.semibold as any },
  resendLinkDisabled: { color: colors.text.muted },
  tryDifferentButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  tryDifferentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  legalText: { fontSize: typography.fontSize.xs, color: colors.text.muted },
  legalLink: { fontSize: typography.fontSize.xs, color: colors.primary.main },
});
