import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { FileText, CheckCircle, UploadCloud, AlertCircle, Eye } from 'lucide-react-native';

export default function DocumentUploadScreen() {
  const [docs, setDocs] = useState({
    profilePhoto: { status: 'verified', name: 'ProfilePhoto_Active.jpg' },
    driversLicense: { status: 'verified', name: 'DL_Vetted_2026.pdf' },
    vehicleRC: { status: 'pending', name: 'RC_TataAce_Pending.jpg' },
  });
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleUpload = (docType: string) => {
    setIsUploading(docType);
    setTimeout(() => {
      setIsUploading(null);
      setDocs((prev: any) => ({
        ...prev,
        [docType]: { status: 'verified', name: `${docType.charAt(0).toUpperCase() + docType.slice(1)}_Uploaded_Vetted.pdf` }
      }));
      Alert.alert('Upload Successful', 'Document has been uploaded and queued for admin review.');
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return { text: 'VERIFIED', bg: '#ECFDF5', color: COLORS.accent, Icon: CheckCircle };
      case 'pending': return { text: 'PENDING REVIEW', bg: '#FFFBEB', color: '#D97706', Icon: AlertCircle };
      default: return { text: 'MISSING', bg: '#FEF2F2', color: COLORS.red, Icon: AlertCircle };
    }
  };

  const renderDocRow = (docType: string, label: string) => {
    const doc = (docs as any)[docType];
    const badge = getStatusBadge(doc?.status || 'missing');
    const isPending = doc?.status === 'pending';

    return (
      <View style={styles.docCard}>
        <View style={styles.docHeader}>
          <FileText size={22} color={COLORS.primary} />
          <Text style={styles.docLabel}>{label}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <badge.Icon size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {doc ? (
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{doc.name}</Text>
            <View style={styles.fileActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => Alert.alert('Preview Document', `Viewing file: ${doc.name}`)}
              >
                <Eye size={16} color={COLORS.primary} />
                <Text style={styles.actionIconText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.noFile}>No document uploaded yet</Text>
        )}

        {isUploading === docType ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} />
        ) : (
          <TouchableOpacity
            style={[styles.uploadBtn, isPending && { backgroundColor: COLORS.surface }]}
            onPress={() => handleUpload(docType)}
          >
            <UploadCloud size={16} color={isPending ? COLORS.primary : COLORS.white} style={{ marginRight: 6 }} />
            <Text style={[styles.uploadBtnText, isPending && { color: COLORS.primary }]}>
              {doc ? 'Upload New Version' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vetting Documents</Text>
          <Text style={styles.subtitle}>Upload the required credentials to maintain active status in the driver pool.</Text>
        </View>

        {renderDocRow('profilePhoto', 'Profile Photo')}
        {renderDocRow('driversLicense', 'Driver\'s License')}
        {renderDocRow('vehicleRC', 'Vehicle RC Proof')}
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
  docCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fileDetails: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionIconText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  noFile: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    marginVertical: SPACING.md,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  uploadBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
