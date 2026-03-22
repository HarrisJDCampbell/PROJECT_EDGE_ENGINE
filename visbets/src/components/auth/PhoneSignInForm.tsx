/**
 * PhoneSignInForm Component
 * Phone number input with country code for SMS authentication
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/styles';
import { typography } from '../../theme/typography';
import { NeonButton } from '../shared/NeonButton';

interface PhoneSignInFormProps {
  onSubmit: (phoneNumber: string) => void;
  loading?: boolean;
  error?: string;
}

export function PhoneSignInForm({
  onSubmit,
  loading = false,
  error,
}: PhoneSignInFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '(' + cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += ') ' + cleaned.substring(3, 6);
    }
    if (cleaned.length > 6) {
      formatted += '-' + cleaned.substring(6, 10);
    }

    return formatted;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleSubmit = () => {
    // Extract just the digits and add country code
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      onSubmit('+1' + digits);
    }
  };

  const isValid = phoneNumber.replace(/\D/g, '').length === 10;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <Text style={styles.countryCode}>+1</Text>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={handleChange}
          placeholder="(555) 555-5555"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
          selectionColor={colors.primary.main}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={14}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* SMS Consent Disclaimer - Required by Twilio */}
      <Text style={styles.consent}>
        By continuing, you consent to receive a one-time SMS verification code.
        Message and data rates may apply.
      </Text>

      <NeonButton
        title="Send Code"
        onPress={handleSubmit}
        disabled={!isValid}
        loading={loading}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: colors.semantic.danger,
  },
  countryCode: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
    paddingVertical: spacing.md,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  error: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
  },
  consent: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
