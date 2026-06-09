import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Update-available modal. Two modes:
 *   - Soft update: shows both "Update Now" and "Later" buttons; user can dismiss.
 *   - Force update: only "Update Now"; back button is blocked.
 */
export default function UpdatePromptModal({
  visible,
  forceUpdate,
  currentVersion,
  latest,
  releaseNotes,
  onUpdate,
  onLater,
}) {
  // Block Android back button when force-update mode is active
  React.useEffect(() => {
    if (!visible || !forceUpdate || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible, forceUpdate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => { if (!forceUpdate) onLater?.(); }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="cloud-download-outline" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>
            {forceUpdate ? 'Update Required' : 'Update Available'}
          </Text>
          <Text style={styles.subtitle}>
            {forceUpdate
              ? `Version ${latest} is required to keep using Evanzo. Please update to continue.`
              : `A newer version (${latest}) of Evanzo is available. Update now for the latest features and fixes.`}
          </Text>

          {releaseNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{releaseNotes}</Text>
            </View>
          ) : null}

          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>You're on</Text>
            <Text style={styles.versionValue}>v{currentVersion}</Text>
            <Icon name="arrow-forward" size={14} color="#8a94a6" style={{ marginHorizontal: 4 }} />
            <Text style={[styles.versionValue, styles.versionLatest]}>v{latest}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onUpdate} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Update Now</Text>
          </TouchableOpacity>

          {!forceUpdate && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onLater} activeOpacity={0.7}>
              <Text style={styles.secondaryBtnText}>Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2C3D5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1b20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5a6478',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  notesBox: {
    width: '100%',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  notesText: {
    fontSize: 12,
    color: '#445065',
    lineHeight: 18,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  versionLabel: { fontSize: 12, color: '#8a94a6', marginRight: 6 },
  versionValue: { fontSize: 13, fontWeight: '600', color: '#445065' },
  versionLatest: { color: '#2C3D5B' },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2C3D5B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryBtnText: { color: '#8a94a6', fontWeight: '500', fontSize: 14 },
});
