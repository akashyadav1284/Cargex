import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import Header from '../components/Header';
import Card from '../components/Card';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Terms & Conditions" showBackButton={true} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.updateText}>Last Updated: June 30, 2026</Text>
          <Text style={styles.intro}>
            Welcome to Cargex. Please read these Terms and Conditions carefully before using our logistics mobile application.
          </Text>

          <Text style={styles.sectionTitle}>1. Account Registration</Text>
          <Text style={styles.bodyText}>
            You must register for an account to use the Cargex matching services. You agree to provide accurate and complete details during registration and keep this information updated. You are responsible for all booking actions initiated under your user account credentials.
          </Text>

          <Text style={styles.sectionTitle}>2. Scope of Matchmaking Services</Text>
          <Text style={styles.bodyText}>
            Cargex operates purely as a technology-based matchmaking platform connecting shippers with independent third-party transport partners and driver drivers. Cargex does not own transport vehicles or act as a common carrier.
          </Text>

          <Text style={styles.sectionTitle}>3. Shipper Obligations & Restrictions</Text>
          <Text style={styles.bodyText}>
            You represent and warrant that all cargo items offered for transport comply with local laws. You shall NOT book delivery of hazardous substances, illegal substances, combustible materials, explosives, or items prohibited by the government.
          </Text>

          <Text style={styles.sectionTitle}>4. Cancellations & Penalties</Text>
          <Text style={styles.bodyText}>
            Users may cancel a dispatch request at any time prior to the driver arriving at the pickup point without fee. If a cancellation is requested after the driver arrives, a nominal dry-run fee may be applied to compensate the transport partner.
          </Text>

          <Text style={styles.sectionTitle}>5. Payments & Dynamic Pricing</Text>
          <Text style={styles.bodyText}>
            Estimated fares are displayed dynamically based on selected cargo category, weight size, vehicle type, and OSRM-calculated routing distance. Upfront prices must be settled using Cash, UPI, or Wallet as selected during checkout.
          </Text>

          <Text style={styles.sectionTitle}>6. Liability Limitations</Text>
          <Text style={styles.bodyText}>
            As a matching platform, Cargex is not responsible for transit damage, delays, or vehicle breakdowns. Independent transport drivers bear prime carriage liability. We suggest verifying all driver partners using the secure Pickup and Drop OTP verification system.
          </Text>

          <Text style={styles.sectionTitle}>7. Governing Law</Text>
          <Text style={styles.bodyText}>
            These terms are governed and construed in accordance with the laws of India. Any legal disputes arising out of the use of our services shall be subject to the exclusive jurisdiction of the courts of New Delhi.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
  },
  updateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  intro: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontWeight: '500',
  },
});
