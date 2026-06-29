import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Mail, Phone, ShieldAlert, FileText, ChevronRight } from 'lucide-react-native';

export default function SupportScreen() {
  const HELPLINE_PHONE = '+919467658854';
  const HELPLINE_EMAIL = 'akashyadav9992462520@gmail.com';

  const handleCall = () => {
    Linking.openURL(`tel:${HELPLINE_PHONE}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${HELPLINE_EMAIL}?subject=Cargex Mobile Support Request`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cargex Support</Text>
          <Text style={styles.subtitle}>We're here to assist you with your logistics operations 24/7.</Text>
        </View>

        {/* Action Options */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Direct Channels</Text>
          
          <TouchableOpacity style={styles.itemRow} onPress={handleCall}>
            <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
              <Phone size={20} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Call Customer Helpline</Text>
              <Text style={styles.itemVal}>+91 9467658854</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.itemRow} onPress={handleEmail}>
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <Mail size={20} color={COLORS.blue} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Send an Email</Text>
              <Text style={styles.itemVal}>akashyadav9992462520@gmail.com</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* FAQs info placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Legal and Policies</Text>
          
          <TouchableOpacity style={styles.itemRow} onPress={() => Linking.openURL('https://cargex.vercel.app/terms')}>
            <View style={[styles.iconBg, { backgroundColor: COLORS.surface }]}>
              <FileText size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Terms & Conditions</Text>
              <Text style={styles.itemVal}>Review service rules and usage guidelines</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.itemRow} onPress={() => Linking.openURL('https://cargex.vercel.app/privacy')}>
            <View style={[styles.iconBg, { backgroundColor: COLORS.surface }]}>
              <ShieldAlert size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Privacy Policy</Text>
              <Text style={styles.itemVal}>Learn how we protect and manage your data</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>© 2026 Cargex Technologies Inc. All rights reserved.</Text>
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
  },
  header: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  itemVal: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 40,
    marginBottom: 20,
  },
});
