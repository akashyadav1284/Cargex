import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Linking, 
  SafeAreaView, 
  ScrollView,
  StatusBar
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Mail, Phone, ShieldAlert, FileText, ChevronRight, MessageSquareCode } from 'lucide-react-native';
import Card from '../components/Card';
import { useNavigation } from '@react-navigation/native';

export default function SupportScreen() {
  const navigation = useNavigation<any>();
  const HELPLINE_PHONE = '+919467658854';
  const HELPLINE_EMAIL = 'akashyadav9992462520@gmail.com';

  const handleCall = () => {
    Linking.openURL(`tel:${HELPLINE_PHONE}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${HELPLINE_EMAIL}?subject=Cargex Mobile Support Request`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${HELPLINE_PHONE.replace('+', '')}?text=Hi Cargex support team, I need help with my dispatch.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Customer Support</Text>
          <Text style={styles.subtitle}>We're here to assist you with your logistics operations 24/7.</Text>
        </View>

        {/* Direct Channels */}
        <Text style={styles.sectionHeader}>Direct Channels</Text>
        <Card variant="outlined" style={styles.supportCard} padding="none">
          {/* Call Helpline */}
          <TouchableOpacity style={styles.itemRow} onPress={handleCall} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: '#F0FDF4' }]}>
              <Phone size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Call Customer Helpline</Text>
              <Text style={styles.itemVal}>+91 9467658854</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* WhatsApp Support */}
          <TouchableOpacity style={styles.itemRow} onPress={handleWhatsApp} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
              <MessageSquareCode size={20} color="#10B981" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>WhatsApp Support</Text>
              <Text style={styles.itemVal}>Chat instantly with our logistics agents</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Email Support */}
          <TouchableOpacity style={styles.itemRow} onPress={handleEmail} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <Mail size={20} color={COLORS.blue} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Send an Email</Text>
              <Text style={styles.itemVal}>akashyadav9992462520@gmail.com</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Legal and Policies */}
        <Text style={styles.sectionHeader}>Legal and Policies</Text>
        <Card variant="outlined" style={styles.supportCard} padding="none">
          <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: '#F9FAFB' }]}>
              <FileText size={20} color={COLORS.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Terms & Conditions</Text>
              <Text style={styles.itemVal}>Review service rules and usage guidelines</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: '#F9FAFB' }]}>
              <ShieldAlert size={20} color={COLORS.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Privacy Policy</Text>
              <Text style={styles.itemVal}>Learn how we protect and manage your data</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

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
    paddingHorizontal: SPACING.lg,
    paddingBottom: 110,
  },
  header: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.2,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  supportCard: {
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemVal: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 66,
  },
  footerNote: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
