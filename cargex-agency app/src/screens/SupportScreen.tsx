import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Mail, Phone, FileText, ShieldAlert, ChevronRight } from 'lucide-react-native';

export default function SupportScreen() {
  const HELPLINE_PHONE = '+919467658854';
  const HELPLINE_EMAIL = 'akashyadav9992462520@gmail.com';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Partner Help Center</Text>
          <Text style={styles.subtitle}>Direct agency business communication channels with Cargex Logistics.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Logistics Operations Helpline</Text>
          
          <TouchableOpacity style={styles.itemRow} onPress={() => Linking.openURL(`tel:${HELPLINE_PHONE}`)}>
            <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
              <Phone size={20} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Call Operations Director</Text>
              <Text style={styles.itemVal}>+91 9467658854</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.itemRow} onPress={() => Linking.openURL(`mailto:${HELPLINE_EMAIL}?subject=Agency Partner Support`)}>
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <Mail size={20} color={COLORS.blue} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Operations Mail Desk</Text>
              <Text style={styles.itemVal}>akashyadav9992462520@gmail.com</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Guidelines</Text>
          
          <TouchableOpacity style={styles.itemRow} onPress={() => Linking.openURL('https://cargex.vercel.app/terms')}>
            <View style={[styles.iconBg, { backgroundColor: COLORS.surface }]}>
              <FileText size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Agency Terms of Service</Text>
              <Text style={styles.itemVal}>Vetting standards and compliance details</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 Cargex Technologies Inc. All rights reserved.</Text>
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
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 40,
    marginBottom: 20,
  },
});
