/**
 * Privacy Policy Screen
 * Full privacy policy for VisBets
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

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      {children}
    </View>
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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <Text style={styles.subtitle}>Privacy Policy</Text>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>
        </Animated.View>

        {/* Intro */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.introCard}>
          <Paragraph>
            VisBets ("VisBets," "we," "us," or "our") respects your privacy and is committed to protecting it. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access or use the VisBets mobile application, website, and related services (collectively, the "Service").
          </Paragraph>
          <Paragraph>
            By using the Service, you consent to the practices described in this Privacy Policy.
          </Paragraph>
        </Animated.View>

        {/* Section 1 */}
        <Section title="1. Information We Collect" delay={150}>
          <Paragraph>
            We collect information in three main ways: information you provide, information collected automatically, and information from third parties.
          </Paragraph>

          <Subsection title="1.1 Information You Provide Directly">
            <Paragraph>When you use VisBets, you may provide:</Paragraph>
            <BulletList items={[
              'Email address',
              'Account registration information',
              'Customer support communications',
              'Subscription status and preferences (billing details are processed by third-party platforms)',
              'Any information you voluntarily submit through forms, feedback, or contact requests',
            ]} />
            <Paragraph>
              You are not required to provide personal information to browse informational pages, but certain features require account creation.
            </Paragraph>
          </Subsection>

          <Subsection title="1.2 Information Collected Automatically">
            <Paragraph>
              When you access the Service, we automatically collect certain technical and usage information, including:
            </Paragraph>
            <BulletList items={[
              'Device type, operating system, and app version',
              'IP address (anonymized or truncated where possible)',
              'App usage patterns (screens viewed, features used, session duration)',
              'Log files, crash reports, and diagnostic data',
              'Date and time of access',
            ]} />
            <Paragraph>
              This data helps us understand how the Service is used and improve performance and reliability.
            </Paragraph>
          </Subsection>

          <Subsection title="1.3 Information from Third Parties">
            <Paragraph>
              We may receive limited information from third-party service providers, such as:
            </Paragraph>
            <BulletList items={[
              'Authentication providers',
              'Subscription and payment platforms (e.g., App Store subscription status)',
              'Analytics and performance tools',
            ]} />
            <Paragraph>We do not receive or store full payment card details.</Paragraph>
          </Subsection>
        </Section>

        {/* Section 2 */}
        <Section title="2. How We Use Your Information" delay={200}>
          <Paragraph>
            We use collected information for legitimate business purposes, including to:
          </Paragraph>
          <BulletList items={[
            'Operate, maintain, and improve the Service',
            'Provide analytics, projections, and personalized experiences',
            'Manage user accounts and subscription access',
            'Communicate service updates and operational messages',
            'Respond to inquiries and customer support requests',
            'Monitor performance, detect errors, and prevent abuse or fraud',
            'Comply with legal and regulatory obligations',
          ]} />
          <Paragraph>
            We do not use personal data to provide gambling services or to place bets on your behalf.
          </Paragraph>
        </Section>

        {/* Section 3 */}
        <Section title="3. Analytics and Performance Monitoring" delay={250}>
          <Paragraph>
            VisBets uses analytics and monitoring tools (such as Firebase or similar services) to:
          </Paragraph>
          <BulletList items={[
            'Measure app performance and stability',
            'Understand feature usage',
            'Identify bugs and crashes',
            'Improve user experience',
          ]} />
          <Paragraph>
            These tools may collect anonymized or aggregated data and operate under their own privacy policies.
          </Paragraph>
        </Section>

        {/* Section 4 */}
        <Section title="4. Cookies and Similar Technologies" delay={300}>
          <Paragraph>
            If you access VisBets through a website, we may use cookies or similar technologies to:
          </Paragraph>
          <BulletList items={[
            'Maintain session functionality',
            'Analyze website usage',
            'Improve performance and usability',
          ]} />
          <Paragraph>
            You may control cookies through your browser settings. Disabling cookies may affect functionality.
          </Paragraph>
        </Section>

        {/* Section 5 */}
        <Section title="5. How We Share Information" delay={350}>
          <View style={styles.importantBox}>
            <Text style={styles.importantTitle}>We do not sell your personal information.</Text>
          </View>
          <Paragraph>
            We may share information only in the following limited circumstances:
          </Paragraph>

          <Subsection title="5.1 Service Providers">
            <Paragraph>
              With trusted third parties who help us operate the Service, including:
            </Paragraph>
            <BulletList items={[
              'Hosting and infrastructure providers',
              'Analytics and monitoring services',
              'Authentication and notification services',
            ]} />
            <Paragraph>
              These providers are contractually obligated to protect your data.
            </Paragraph>
          </Subsection>

          <Subsection title="5.2 Legal Requirements">
            <Paragraph>
              We may disclose information if required to do so by law or in response to valid legal requests, subpoenas, or court orders.
            </Paragraph>
          </Subsection>

          <Subsection title="5.3 Business Transfers">
            <Paragraph>
              If VisBets is involved in a merger, acquisition, restructuring, or sale of assets, user information may be transferred as part of that transaction.
            </Paragraph>
          </Subsection>
        </Section>

        {/* Section 6 */}
        <Section title="6. Data Security" delay={400}>
          <Paragraph>
            We implement reasonable administrative, technical, and organizational measures designed to protect your information, including:
          </Paragraph>
          <BulletList items={[
            'Encryption in transit and at rest where appropriate',
            'Restricted access to personal data',
            'Secure infrastructure and authentication controls',
          ]} />
          <Paragraph>
            However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </Paragraph>
        </Section>

        {/* Section 7 */}
        <Section title="7. Data Retention" delay={450}>
          <Paragraph>We retain personal information only for as long as necessary to:</Paragraph>
          <BulletList items={[
            'Provide the Service',
            'Fulfill the purposes described in this policy',
            'Comply with legal, accounting, or regulatory obligations',
          ]} />
          <Paragraph>
            When data is no longer required, it is securely deleted or anonymized.
          </Paragraph>
        </Section>

        {/* Section 8 */}
        <Section title="8. Your Privacy Rights" delay={500}>
          <Paragraph>Depending on your jurisdiction, you may have the right to:</Paragraph>
          <BulletList items={[
            'Access the personal data we hold about you',
            'Request correction of inaccurate information',
            'Request deletion of your personal data',
            'Object to or restrict certain processing activities',
          ]} />
          <Paragraph>To exercise your rights, contact us at:</Paragraph>
          <View style={styles.contactInline}>
            <Ionicons name="mail-outline" size={16} color={colors.primary.main} />
            <Text style={styles.contactTextInline}>privacy@visbets.com</Text>
          </View>
          <Paragraph>We may need to verify your identity before fulfilling requests.</Paragraph>
        </Section>

        {/* Section 9 */}
        <Section title="9. California Privacy Rights" delay={550}>
          <Paragraph>
            If you are a California resident, you may have rights under the California Consumer Privacy Act (CCPA), including the right to:
          </Paragraph>
          <BulletList items={[
            'Know what personal data we collect',
            'Request deletion of personal data',
            'Opt out of the sale of personal data (note: VisBets does not sell personal data)',
          ]} />
          <Paragraph>Requests can be submitted via the contact information below.</Paragraph>
        </Section>

        {/* Section 10 */}
        <Section title="10. Children's Privacy" delay={600}>
          <Paragraph>
            VisBets is not intended for individuals under the age of 18.
          </Paragraph>
          <Paragraph>
            We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will delete it promptly.
          </Paragraph>
        </Section>

        {/* Section 11 */}
        <Section title="11. International Users" delay={650}>
          <Paragraph>
            If you access the Service from outside the United States, you acknowledge that your information may be transferred to and processed in the United States, where data protection laws may differ from those in your jurisdiction.
          </Paragraph>
        </Section>

        {/* Section 12 */}
        <Section title="12. Third-Party Links" delay={700}>
          <Paragraph>
            The Service may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those third parties.
          </Paragraph>
        </Section>

        {/* Section 13 */}
        <Section title="13. Changes to This Privacy Policy" delay={750}>
          <Paragraph>
            We may update this Privacy Policy from time to time.
          </Paragraph>
          <Paragraph>
            Changes become effective when posted. Continued use of the Service after changes constitutes acceptance of the revised policy.
          </Paragraph>
        </Section>

        {/* Section 14 */}
        <Section title="14. Contact Us" delay={800}>
          <Paragraph>
            If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:
          </Paragraph>
          <View style={styles.contactBox}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.primary.main} />
              <Text style={styles.contactText}>privacy@visbets.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.primary.main} />
              <Text style={styles.contactText}>support@visbets.com</Text>
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
  subsection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  importantTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    textAlign: 'center',
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
  contactInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  contactTextInline: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
  },
  footerSpacer: {
    height: spacing['3xl'],
  },
});
