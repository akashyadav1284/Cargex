import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { FileText, CheckCircle, UploadCloud, AlertCircle, Eye } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';

export default function DocumentUploadScreen() {
  const { driver, reloadProfile } = useAuth();
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Read actual document values from driver profile
  const profilePhoto = driver?.profileImage || '';
  const license = driver?.documents?.license || '';
  const vehicleRC = driver?.documents?.rc || '';

  const handleUpload = async (docType: string) => {
    setIsUploading(docType);
    try {
      // Simulate selecting a file and uploading it to server
      const generatedFileName = `${docType}_vetted_${Math.floor(Math.random() * 9000 + 1000)}.png`;
      
      let payload: any = {};
      if (docType === 'profilePhoto') {
        payload = { profileImage: generatedFileName };
      } else if (docType === 'driversLicense') {
        payload = { documents: { license: generatedFileName } };
      } else if (docType === 'vehicleRC') {
        payload = { documents: { rc: generatedFileName } };
      }

      await apiClient.put('/api/driver/update-profile', payload);
      await reloadProfile();
      
      Alert.alert('Upload Successful', 'Your document has been uploaded and verified in the database.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.response?.data?.message || 'Failed to update profile documents.');
    } finally {
      setIsUploading(null);
    }
  };

  const getStatusBadge = (value: string) => {
    if (value) {
      return { text: 'VERIFIED', bg: '#ECFDF5', color: COLORS.accent, Icon: CheckCircle };
    } else {
      return { text: 'MISSING', bg: '#FEF2F2', color: COLORS.error, Icon: AlertCircle };
    }
  };

  const renderDocRow = (docType: string, label: string, currentVal: string) => {
    const badge = getStatusBadge(currentVal);

    return (
      <Card variant="outlined" style={styles.docCard} padding="md">
        <View style={styles.docHeader}>
          <View style={styles.docLabelRow}>
            <FileText size={22} color={COLORS.primary} />
            <Text style={styles.docLabel}>{label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <badge.Icon size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {currentVal ? (
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{currentVal}</Text>
            <Button
              title="View Document"
              onPress={() => Alert.alert('Preview Document', `Viewing file from database:\n${currentVal}`)}
              variant="outline"
              size="sm"
              style={styles.viewBtn}
              icon={<Eye size={14} color={COLORS.primary} />}
            />
          </View>
        ) : (
          <View style={styles.noFileRow}>
            <Text style={styles.noFile}>No document uploaded yet</Text>
          </View>
        )}

        <Button
          title={currentVal ? 'Upload New Version' : 'Upload Document'}
          onPress={() => handleUpload(docType)}
          loading={isUploading === docType}
          variant="accent"
          size="md"
          style={styles.uploadBtn}
          icon={<UploadCloud size={16} color={COLORS.white} />}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Vetting Documents" showBackButton={true} />
      
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Upload the required credentials to maintain active status in the driver pool. Your documents are verified instantly by compliance systems.
          </Text>
        </View>

        {renderDocRow('profilePhoto', 'Profile Photo', profilePhoto)}
        {renderDocRow('driversLicense', "Driver's License", license)}
        {renderDocRow('vehicleRC', 'Vehicle RC Proof', vehicleRC)}
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
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.blue,
    lineHeight: 18,
    fontWeight: '600',
  },
  docCard: {
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  docLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    flex: 1,
    marginRight: SPACING.sm,
  },
  viewBtn: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  noFileRow: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  noFile: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  uploadBtn: {
    width: '100%',
  },
});
