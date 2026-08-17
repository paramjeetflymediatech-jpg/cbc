import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';
import { launchImageLibrary } from 'react-native-image-picker';

interface EditProfileScreenProps {
  navigation: any;
}

const PRESET_AVATARS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80', label: 'Male' },
  { id: '2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', label: 'Female' },
  { id: '3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80', label: 'Boy' },
  { id: '4', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80', label: 'Girl' },
  { id: '5', url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80', label: 'General' },
];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const { showAlert } = useSweetAlert();

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatarUrl || PRESET_AVATARS[0].url
  );
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Profile picture adjustment transforms
  const [avatarScale, setAvatarScale] = useState<number>(user?.avatarScale || 1);
  const [avatarTranslateX, setAvatarTranslateX] = useState<number>(user?.avatarTranslateX || 0);
  const [avatarTranslateY, setAvatarTranslateY] = useState<number>(user?.avatarTranslateY || 0);
  const [avatarRotate, setAvatarRotate] = useState<number>(user?.avatarRotate || 0);

  // Modal temporary transform states
  const [adjustModalVisible, setAdjustModalVisible] = useState<boolean>(false);
  const [tempScale, setTempScale] = useState<number>(user?.avatarScale || 1);
  const [tempX, setTempX] = useState<number>(user?.avatarTranslateX || 0);
  const [tempY, setTempY] = useState<number>(user?.avatarTranslateY || 0);
  const [tempRotate, setTempRotate] = useState<number>(user?.avatarRotate || 0);

  const showRebuildAlert = () => {
    showAlert({
      title: 'Rebuild Required',
      message: 'A native library (Image Picker) was just installed. Please stop your current terminal, run "npm run android" in your terminal to rebuild/recompile the app with the new native code. For now, you can select from the preset avatars below!',
      type: 'warning',
    });
  };

  const handleSelectImage = () => {
    try {
      const p = launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 1,
          includeBase64: false,
        },
        (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorCode) {
            console.warn('ImagePicker Error: ', response.errorMessage);
            showAlert({
              title: 'Image Picker Error',
              message: response.errorMessage || 'Failed to select image from library.',
              type: 'error',
            });
          } else if (response.assets && response.assets.length > 0) {
            const selectedUri = response.assets[0].uri;
            if (selectedUri) {
              setAvatarUrl(selectedUri);
              // Open adjustment modal automatically for selected image
              setTempScale(1);
              setTempX(0);
              setTempY(0);
              setTempRotate(0);
              setAdjustModalVisible(true);
            }
          }
        }
      );

      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('Native image picker promise rejected:', err);
          showRebuildAlert();
        });
      }
    } catch (err: any) {
      console.warn('Native image picker failed:', err);
      showRebuildAlert();
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatarInput('');
    // Open adjustment modal automatically for chosen preset
    setTempScale(1);
    setTempX(0);
    setTempY(0);
    setTempRotate(0);
    setAdjustModalVisible(true);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarInput.trim().startsWith('http')) {
      setAvatarUrl(customAvatarInput.trim());
      // Open adjustment modal automatically for custom URL
      setTempScale(1);
      setTempX(0);
      setTempY(0);
      setTempRotate(0);
      setAdjustModalVisible(true);
    } else {
      showAlert({
        title: 'Invalid URL',
        message: 'Please enter a valid HTTP/HTTPS image link.',
        type: 'warning',
      });
    }
  };

  const openAdjustmentModal = () => {
    // Populate temp states from current applied values
    setTempScale(avatarScale);
    setTempX(avatarTranslateX);
    setTempY(avatarTranslateY);
    setTempRotate(avatarRotate);
    setAdjustModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert({
        title: 'Name Required',
        message: 'Please enter your name.',
        type: 'warning',
      });
      return;
    }

    try {
      await updateUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatarUrl,
        avatarScale,
        avatarTranslateX,
        avatarTranslateY,
        avatarRotate,
      });

      showAlert({
        title: 'Profile Updated',
        message: 'Your profile changes have been saved successfully!',
        type: 'success',
        confirmText: 'Awesome',
        onConfirm: () => {
          navigation.goBack();
        },
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarOuterRing}
              onPress={handleSelectImage}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: avatarUrl }}
                  style={[
                    styles.largeAvatar,
                    {
                      transform: [
                        { scale: avatarScale },
                        { translateX: avatarTranslateX },
                        { translateY: avatarTranslateY },
                        { rotate: `${avatarRotate}deg` },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📸</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.avatarActionRow}>
              <Text style={styles.avatarLabel}>Choose Profile Photo</Text>
              <TouchableOpacity
                style={styles.adjustBtnSmall}
                onPress={openAdjustmentModal}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnTextSmall}>⚙️ Adjust Crop</Text>
              </TouchableOpacity>
            </View>

            {/* Presets List */}
            <View style={styles.presetsRow}>
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemActive,
                    ]}
                    onPress={() => handleSelectPreset(preset.url)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetImage} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.toggleCustomBtn}
              onPress={() => setShowCustomInput(!showCustomInput)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleCustomText}>
                {showCustomInput ? 'Hide Custom Image URL' : 'Use Custom Image URL'}
              </Text>
            </TouchableOpacity>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  value={customAvatarInput}
                  onChangeText={setCustomAvatarInput}
                  placeholder="Paste direct image link (https://...)"
                  placeholderTextColor={colors.textMuted}
                  style={styles.urlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyCustomUrl}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Adjust Profile Photo Modal */}
        <Modal
          visible={adjustModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAdjustModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adjust Profile Photo</Text>
              <Text style={styles.modalSubtitle}>Use the D-pad and Zoom keys to scale and position your face perfectly.</Text>

              {/* Mask Container */}
              <View style={styles.previewContainer}>
                <View style={styles.previewCircle}>
                  <Image
                    source={{ uri: avatarUrl }}
                    style={[
                      styles.previewImage,
                      {
                        transform: [
                          { scale: tempScale },
                          { translateX: tempX },
                          { translateY: tempY },
                          { rotate: `${tempRotate}deg` },
                        ],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Controls Dashboard */}
              <View style={styles.controlsContainer}>
                {/* Scale Control */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Zoom Size ({tempScale.toFixed(1)}x)</Text>
                  <View style={styles.controlRow}>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => setTempScale(Math.max(1, tempScale - 0.1))}
                    >
                      <Text style={styles.adjustBtnText}>🔍 −</Text>
                    </TouchableOpacity>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${((tempScale - 1) / 2) * 100}%` }]} />
                    </View>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => setTempScale(Math.min(3, tempScale + 0.1))}
                    >
                      <Text style={styles.adjustBtnText}>🔍 +</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Move / Pan D-Pad Panel */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Adjust Alignment</Text>
                  <View style={styles.dpadContainer}>
                    {/* Up */}
                    <TouchableOpacity
                      style={[styles.dpadBtn, styles.dpadUp]}
                      onPress={() => setTempY(tempY - 4)}
                    >
                      <Text style={styles.dpadText}>▲</Text>
                    </TouchableOpacity>

                    <View style={styles.dpadMiddleRow}>
                      {/* Left */}
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => setTempX(tempX - 4)}
                      >
                        <Text style={styles.dpadText}>◀</Text>
                      </TouchableOpacity>

                      {/* Reset */}
                      <TouchableOpacity
                        style={[styles.dpadBtn, styles.dpadReset]}
                        onPress={() => {
                          setTempScale(1);
                          setTempX(0);
                          setTempY(0);
                          setTempRotate(0);
                        }}
                      >
                        <Text style={styles.dpadResetText}>⟲</Text>
                      </TouchableOpacity>

                      {/* Right */}
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => setTempX(tempX + 4)}
                      >
                        <Text style={styles.dpadText}>▶</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Down */}
                    <TouchableOpacity
                      style={[styles.dpadBtn, styles.dpadDown]}
                      onPress={() => setTempY(tempY + 4)}
                    >
                      <Text style={styles.dpadText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Rotate Control */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Rotate Orientation ({tempRotate}°)</Text>
                  <View style={styles.rotateRow}>
                    <TouchableOpacity
                      style={styles.rotateActionBtn}
                      onPress={() => setTempRotate((tempRotate - 90 + 360) % 360)}
                    >
                      <Text style={styles.rotateActionText}>↺ Rotate L</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rotateActionBtn}
                      onPress={() => setTempRotate((tempRotate + 90) % 360)}
                    >
                      <Text style={styles.rotateActionText}>↻ Rotate R</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setAdjustModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveModalBtn}
                  onPress={() => {
                    setAvatarScale(tempScale);
                    setAvatarTranslateX(tempX);
                    setAvatarTranslateY(tempY);
                    setAvatarRotate(tempRotate);
                    setAdjustModalVisible(false);
                  }}
                >
                  <Text style={styles.saveModalText}>Apply Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 50,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarOuterRing: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  cameraIcon: {
    fontSize: 14,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  adjustBtnSmall: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adjustBtnTextSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  presetItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    padding: 2,
  },
  presetItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  toggleCustomBtn: {
    paddingVertical: 6,
  },
  toggleCustomText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  urlInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: colors.textPrimary,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    height: 40,
  },
  applyText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },

  // Modal Adjustment styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  previewContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  controlGroup: {
    marginBottom: 16,
    width: '100%',
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // D-Pad navigation layout
  dpadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dpadBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  dpadUp: {
    marginBottom: 4,
  },
  dpadMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dpadDown: {
    marginTop: 4,
  },
  dpadText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  dpadReset: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dpadResetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Rotate panel
  rotateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rotateActionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rotateActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  saveModalBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveModalText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
});
