/**
 * Terms of Service Screen
 * Full legal terms and conditions for VisBets
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/styles';

const EFFECTIVE_DATE = 'January 30, 2026';

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Animated.View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.titleContainer}>
          <Text style={styles.title}>VisBets</Text>
          <Text style={styles.subtitle}>Terms of Service</Text>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>
        </Animated.View>

        {/* Intro */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.introCard}>
          <Paragraph>
            These Terms of Service ("Terms") govern your access to and use of the VisBets mobile application, website, and related services (collectively, the "Service"), operated by VisBets ("VisBets," "we," "us," or "our").
          </Paragraph>
          <Paragraph>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.
          </Paragraph>
        </Animated.View>

        {/* Section 1 */}
        <Section title="1. Overview of the Service" delay={150}>
          <Paragraph>
            VisBets is a sports analytics and information platform designed to provide users with statistical insights, projections, data visualizations, and analytical tools related to sporting events.
          </Paragraph>

          <View style={styles.importantBox}>
            <Text style={styles.importantTitle}>IMPORTANT CLARIFICATION</Text>
            <Text style={styles.importantSubtitle}>VisBets:</Text>
            <BulletList items={[
              'Does not accept, place, or facilitate bets',
              'Is not a sportsbook, gambling operator, or betting exchange',
              'Does not guarantee outcomes, profits, or financial success',
              'Does not provide financial, legal, or investment advice',
            ]} />
            <Paragraph>
              All content provided through the Service is for informational and educational purposes only.
            </Paragraph>
          </View>
        </Section>

        {/* Section 2 */}
        <Section title="2. Eligibility" delay={200}>
          <Paragraph>To use VisBets, you must:</Paragraph>
          <BulletList items={[
            'Be at least 18 years old, or the age of majority in your jurisdiction',
            'Have the legal capacity to enter into these Terms',
            'Use the Service in compliance with all applicable laws and regulations',
          ]} />
          <Paragraph>
            You are solely responsible for determining whether your use of the Service is lawful in your location.
          </Paragraph>
        </Section>

        {/* Section 3 */}
        <Section title="3. Account Registration and Security" delay={250}>
          <Paragraph>Certain features require creating an account.</Paragraph>
          <Paragraph>You agree to:</Paragraph>
          <BulletList items={[
            'Provide accurate, current, and complete information',
            'Maintain the confidentiality of your login credentials',
            'Notify us immediately of unauthorized access or security breaches',
          ]} />
          <Paragraph>
            You are responsible for all activity conducted under your account, whether authorized by you or not.
          </Paragraph>
        </Section>

        {/* Section 4 */}
        <Section title="4. Subscriptions, Billing, and Payments" delay={300}>
          <Paragraph>
            VisBets may offer free and paid subscription tiers (including but not limited to Free, VisPlus, and VisMax).
          </Paragraph>
          <Text style={styles.subsectionTitle}>Billing Terms</Text>
          <BulletList items={[
            'Payments are processed through third-party platforms (e.g., Apple App Store)',
            'Subscription pricing and features may change at any time',
            'Subscriptions automatically renew unless canceled through the platform provider',
            'We do not manage refunds, chargebacks, or billing disputes handled by third parties',
          ]} />
          <Paragraph>You are responsible for managing your subscription settings.</Paragraph>
        </Section>

        {/* Section 5 */}
        <Section title="5. No Guarantees or Reliance" delay={350}>
          <Paragraph>Sports outcomes are inherently uncertain.</Paragraph>
          <Paragraph>You acknowledge and agree that:</Paragraph>
          <BulletList items={[
            'Projections are based on historical data, algorithms, and statistical models',
            'Models may be inaccurate, incomplete, or outdated',
            'Actual outcomes may differ significantly from projections',
          ]} />
          <Paragraph>
            You agree not to rely on VisBets content as the sole basis for any decision involving risk or financial exposure.
          </Paragraph>
        </Section>

        {/* Section 6 */}
        <Section title="6. Acceptable Use Policy" delay={400}>
          <Paragraph>You agree not to:</Paragraph>
          <BulletList items={[
            'Reverse engineer, decompile, or attempt to extract source code',
            'Scrape, harvest, or systematically collect data from the Service',
            'Use bots, scripts, or automated tools to access the Service',
            'Circumvent subscription, paywalls, or access controls',
            'Use the Service for unlawful, fraudulent, or abusive purposes',
            'Misrepresent VisBets content as guaranteed or endorsed outcomes',
          ]} />
          <Paragraph>
            Violation of this section may result in immediate suspension or termination.
          </Paragraph>
        </Section>

        {/* Section 7 */}
        <Section title="7. Intellectual Property Rights" delay={450}>
          <Paragraph>
            All content available through the Service, including but not limited to:
          </Paragraph>
          <BulletList items={[
            'Software',
            'Algorithms',
            'Data visualizations',
            'UI/UX designs',
            'Logos, trademarks, and branding',
            'Text, graphics, and layout',
          ]} />
          <Paragraph>
            is owned by VisBets or its licensors and protected by intellectual property laws.
          </Paragraph>
          <Paragraph>
            No rights are granted to you except as expressly stated in these Terms.
          </Paragraph>
        </Section>

        {/* Section 8 */}
        <Section title="8. Third-Party Data and Services" delay={500}>
          <Paragraph>
            The Service may incorporate data, APIs, or services provided by third parties.
          </Paragraph>
          <Paragraph>VisBets:</Paragraph>
          <BulletList items={[
            'Does not guarantee the accuracy or availability of third-party data',
            'Is not responsible for errors, interruptions, or omissions from third-party sources',
            'Does not endorse third-party websites or services linked from the Service',
          ]} />
          <Paragraph>
            Your use of third-party services is governed by their respective terms.
          </Paragraph>
        </Section>

        {/* Section 9 */}
        <Section title="9. User Feedback" delay={550}>
          <Paragraph>If you submit feedback, ideas, or suggestions to VisBets:</Paragraph>
          <BulletList items={[
            'You grant us a non-exclusive, perpetual, irrevocable, royalty-free license to use them',
            'No compensation is owed to you for such submissions',
          ]} />
        </Section>

        {/* Section 10 */}
        <Section title="10. Suspension and Termination" delay={600}>
          <Paragraph>We reserve the right to:</Paragraph>
          <BulletList items={[
            'Suspend or terminate your account',
            'Restrict access to the Service',
            'Remove content or features',
          ]} />
          <Paragraph>
            at any time, with or without notice, if you violate these Terms or if we reasonably believe your use poses legal, technical, or reputational risk.
          </Paragraph>
        </Section>

        {/* Section 11 */}
        <Section title="11. Disclaimer of Warranties" delay={650}>
          <Paragraph>The Service is provided "AS IS" and "AS AVAILABLE."</Paragraph>
          <Paragraph>
            To the fullest extent permitted by law, VisBets disclaims all warranties, including:
          </Paragraph>
          <BulletList items={[
            'Merchantability',
            'Fitness for a particular purpose',
            'Accuracy or reliability of data',
            'Uninterrupted or error-free operation',
          ]} />
        </Section>

        {/* Section 12 */}
        <Section title="12. Limitation of Liability" delay={700}>
          <Paragraph>To the maximum extent permitted by law:</Paragraph>
          <BulletList items={[
            'VisBets shall not be liable for indirect, incidental, consequential, or punitive damages',
            'VisBets is not responsible for losses, damages, or decisions arising from reliance on Service content',
          ]} />
          <Paragraph>Your sole remedy is to discontinue use of the Service.</Paragraph>
        </Section>

        {/* Section 13 */}
        <Section title="13. Indemnification" delay={750}>
          <Paragraph>
            You agree to indemnify and hold harmless VisBets and its affiliates from any claims, losses, liabilities, damages, or expenses arising out of:
          </Paragraph>
          <BulletList items={[
            'Your use of the Service',
            'Your violation of these Terms',
            'Your violation of any applicable law or third-party rights',
          ]} />
        </Section>

        {/* Section 14 */}
        <Section title="14. Changes to the Service or Terms" delay={800}>
          <Paragraph>We may:</Paragraph>
          <BulletList items={[
            'Modify or discontinue any part of the Service',
            'Update these Terms at any time',
          ]} />
          <Paragraph>Changes take effect upon posting. Continued use constitutes acceptance.</Paragraph>
        </Section>

        {/* Section 15 */}
        <Section title="15. Governing Law" delay={850}>
          <Paragraph>
            These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.
          </Paragraph>
        </Section>

        {/* Section 16 */}
        <Section title="16. Severability" delay={900}>
          <Paragraph>
            If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.
          </Paragraph>
        </Section>

        {/* Section 17 */}
        <Section title="17. Entire Agreement" delay={950}>
          <Paragraph>
            These Terms constitute the entire agreement between you and VisBets regarding the Service and supersede all prior agreements or understandings.
          </Paragraph>
        </Section>

        {/* Section 18 */}
        <Section title="18. Contact Information" delay={1000}>
          <Paragraph>For questions regarding these Terms, contact us at:</Paragraph>
          <View style={styles.contactBox}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.primary.main} />
              <Text style={styles.contactText}>support@visbets.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.primary.main} />
              <Text style={styles.contactText}>legal@visbets.com</Text>
            </View>
          </View>
        </Section>

        {/* Footer spacing */}
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  effectiveDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  introCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  bulletList: {
    marginBottom: spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    marginRight: spacing.sm,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  importantBox: {
    backgroundColor: colors.primary.main + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  importantTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  importantSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  contactBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
  },
  footerSpacer: {
    height: spacing['3xl'],
  },
});
