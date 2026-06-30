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

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Privacy Policy" showBackButton={true} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.updateText}>Last Updated: June 30, 2026</Text>
          <Text style={styles.intro}>
            At Cargex, protecting your privacy is our primary concern. This policy details what data we collect, how it is handled, and your privacy control rights.
          </Text>

          <Text style={styles.sectionTitle}>1. Data Collection</Text>
          <Text style={styles.bodyText}>
            We collect personal identity data you submit, including your Full Name, Email, and Phone Number. We also track real-time location metrics (lat/lon coordinates) of your pickup/drop points and vehicle dispatch tracking to facilitate secure cargo routing.
          </Text>

          <Text style={styles.sectionTitle}>2. Use of Information</Text>
          <Text style={styles.bodyText}>
            The coordinates and contacts gathered are used exclusively to calculate distance metrics, recommend vehicles, pair you with driver partners, broadcast websocket location pins, and verify dispatch handshakes using secure OTPs.
          </Text>

          <Text style={styles.sectionTitle}>3. Shared Data With Drivers</Text>
          <Text style={styles.bodyText}>
            To execute deliveries successfully, your pickup addresses, drop addresses, cargo weights, passenger names, and phone numbers are shared with the matching transport driver who accepts your dispatch.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security & Storage</Text>
          <Text style={styles.bodyText}>
            All communication with our backend APIs is encrypted using industry-standard SSL certificates. Password databases are hashed, and authorization sessions are authenticated using secure JSON Web Tokens.
          </Text>

          <Text style={styles.sectionTitle}>5. Location Services & Permissions</Text>
          <Text style={styles.bodyText}>
            The mobile app asks for GPS location access to make pickup geocoding easier. You can refuse this permission, though you will need to type in your pickup address coordinates manually.
          </Text>

          <Text style={styles.sectionTitle}>6. Access & Account Deletion</Text>
          <Text style={styles.bodyText}>
            You have full rights to request correction or complete removal of your personal profile data from our databases. To delete your account data, please get in touch with our helpdesk team.
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
