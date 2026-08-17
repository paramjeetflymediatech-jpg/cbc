import React, { createContext, useContext, useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../theme/colors';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface SweetAlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const SweetAlertContext = createContext<SweetAlertContextType | undefined>(undefined);

export const SweetAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [config, setConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const [scaleAnim] = useState(new Animated.Value(0.8));

  const showAlert = (options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  };

  const hideAlert = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const handleConfirm = () => {
    hideAlert();
    if (config.onConfirm) {
      config.onConfirm();
    }
  };

  const handleCancel = () => {
    hideAlert();
    if (config.onCancel) {
      config.onCancel();
    }
  };

  const renderIcon = () => {
    const type = config.type || 'info';
    switch (type) {
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Text style={[styles.iconText, { color: colors.success }]}>✓</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
            <Text style={[styles.iconText, { color: colors.error }]}>✕</Text>
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            <Text style={[styles.iconText, { color: colors.warning, transform: [{ translateY: -1 }] }]}>!</Text>
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
            <Text style={[styles.iconText, { color: colors.info, fontWeight: '800' }]}>i</Text>
          </View>
        );
    }
  };

  return (
    <SweetAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View style={[styles.alertCard, { transform: [{ scale: scaleAnim }] }]}>
            {renderIcon()}
            <Text style={styles.titleText}>{config.title}</Text>
            <Text style={styles.messageText}>{config.message}</Text>

            <View style={styles.buttonRow}>
              {config.cancelText ? (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.85}>
                  <Text style={styles.cancelButtonText}>{config.cancelText}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: config.type === 'error' ? colors.error : config.type === 'warning' ? colors.warning : colors.primary }
                ]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonText}>{config.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SweetAlertContext.Provider>
  );
};

export const useSweetAlert = () => {
  const context = useContext(SweetAlertContext);
  if (!context) {
    throw new Error('useSweetAlert must be used within a SweetAlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});
