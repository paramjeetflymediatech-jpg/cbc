import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const WebViewComponent = WebView as any;

export const HospitalPaymentCheckoutScreen: React.FC<any> = ({
  navigation,
  route,
}) => {
  const { redirectUrl, merchantTransactionId, packageInfo } = route.params || {};
  const webViewRef = useRef<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resultData, setResultData] = useState<{
    addedLeads?: number;
    balance?: number;
    subscriptionId?: number;
    transactionId?: string;
  }>({});

  const leadCount = packageInfo?.leadCount || packageInfo?.leadsCount || 0;
  const price = Number(packageInfo?.price || 0);

  // Function to verify payment status with backend API
  const verifyPaymentWithBackend = async (isManualCheck: boolean = false) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await api.get('/payments/phonepe/status', {
        params: { merchantTransactionId },
      });

      if (res.data && res.data.success && res.data.status === 'SUCCESS') {
        setPaymentSuccess(true);
        setResultData({
          addedLeads: res.data.addedLeads || leadCount,
          balance: res.data.balance,
          subscriptionId: res.data.subscriptionId,
          transactionId: merchantTransactionId,
        });
      } else if (res.data && res.data.status === 'FAILED') {
        if (isManualCheck) {
          setPaymentFailed(true);
          setErrorMessage(res.data.message || 'Payment was declined or cancelled.');
        }
      } else {
        if (isManualCheck) {
          Alert.alert(
            'Payment Pending',
            'We have not received payment confirmation from the bank yet. If money was deducted, it will be credited shortly.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err: any) {
      console.log('Status verification error:', err);
      if (isManualCheck) {
        Alert.alert('Status Check', 'Could not verify payment status right now. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Intercept navigation state changes inside WebView
  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState || {};

    if (!url) return;

    // Check for success redirect
    if (
      url.includes('status=success') ||
      url.includes('status=already_successful') ||
      (url.includes('/api/payments/phonepe/callback') && url.includes('PAYMENT_SUCCESS'))
    ) {
      // Extract query params if available
      try {
        const urlObj = new URL(url);
        const added = urlObj.searchParams.get('added');
        const balance = urlObj.searchParams.get('balance');

        setPaymentSuccess(true);
        setResultData({
          addedLeads: added ? Number(added) : leadCount,
          balance: balance ? Number(balance) : undefined,
          transactionId: merchantTransactionId,
        });

        // Also ping status to get subscriptionId for invoice
        verifyPaymentWithBackend(false);
      } catch {
        verifyPaymentWithBackend(false);
      }
      return;
    }

    // Check for failure redirect
    if (url.includes('error=') || url.includes('status=failed')) {
      setPaymentFailed(true);
      setErrorMessage('Payment could not be completed. Please try again.');
    }
  };

  // Handle UPI app deep links (e.g. upi://pay, phonepe://, paytm://, gpay://)
  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const { url } = request;

    // If it's standard http or https, allow webview to load
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    // If it's a UPI app or native payment app intent, open via Linking
    if (
      url.startsWith('upi:') ||
      url.startsWith('phonepe:') ||
      url.startsWith('paytmmp:') ||
      url.startsWith('tez:') ||
      url.startsWith('intent:')
    ) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // If specific app is not installed, open default UPI intent if possible
            Linking.openURL(url).catch(() => {
              Alert.alert('UPI App', 'Could not launch the selected UPI application.');
            });
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Unable to open UPI application.');
        });
      return false;
    }

    return true;
  };

  const handleCancelPrompt = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to exit checkout? Any pending transaction will be cancelled.',
      [
        { text: 'Keep Paying', style: 'cancel' },
        { text: 'Exit Checkout', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Checkout Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelPrompt}>
          <Text style={styles.cancelBtnText}>✕ Close</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <View style={styles.secureBadge}>
            <Text style={styles.secureBadgeIcon}>🔒</Text>
            <Text style={styles.secureBadgeText}>PhonePe 256-Bit SSL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setLoading(true);
            webViewRef.current?.reload();
          }}
        >
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Package Summary Mini Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryPkgName}>{packageInfo?.name || 'Lead Credit Package'}</Text>
          <Text style={styles.summaryLeads}>⚡ +{leadCount} Verified Patient Leads</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryAmount}>₹{price.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryGst}>Incl. 18% GST</Text>
        </View>
      </View>

      {/* Loading Progress Bar */}
      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingBarText}>Connecting to PhonePe Secure Gateway...</Text>
        </View>
      )}

      {/* PhonePe Payment Gateway WebView */}
      <View style={styles.webViewContainer}>
        <WebViewComponent
          ref={webViewRef}
          source={{ uri: redirectUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="always"
          style={styles.webView}
        />
      </View>

      {/* Bottom Bar for UPI App Return Verification */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomHelpText}>Paid in UPI App (PhonePe / GPay / Paytm)?</Text>
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={() => verifyPaymentWithBackend(true)}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.verifyBtnText}>⚡ Check Payment Status</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SUCCESS MODAL */}
      <Modal visible={paymentSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your payment has been verified and lead credits are credited instantly.
            </Text>

            {/* Credit Card Box */}
            <View style={styles.creditBox}>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Package Purchased</Text>
                <Text style={styles.creditValBold}>{packageInfo?.name}</Text>
              </View>
              <View style={styles.creditDivider} />
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Leads Added</Text>
                <Text style={styles.creditHighlight}>+{resultData.addedLeads || leadCount} Credits</Text>
              </View>
              {resultData.balance !== undefined && (
                <View style={styles.creditRow}>
                  <Text style={styles.creditLabel}>Total New Balance</Text>
                  <Text style={styles.creditValBold}>{resultData.balance} Leads</Text>
                </View>
              )}
              <View style={styles.creditDivider} />
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Amount Paid</Text>
                <Text style={styles.creditValBold}>₹{price.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.invoicePrimaryBtn}
                onPress={() => {
                  setPaymentSuccess(false);
                  navigation.replace('HospitalInvoice', {
                    subscriptionId: resultData.subscriptionId,
                  });
                }}
              >
                <Text style={styles.invoicePrimaryBtnText}>🧾 View Tax Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.leadsSecondaryBtn}
                onPress={() => {
                  setPaymentSuccess(false);
                  navigation.replace('HospitalLeads');
                }}
              >
                <Text style={styles.leadsSecondaryBtnText}>⚡ Go to My Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setPaymentSuccess(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAILED MODAL */}
      <Modal visible={paymentFailed} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.failedModalCard}>
            <View style={styles.failedIconCircle}>
              <Text style={styles.failedCross}>✕</Text>
            </View>

            <Text style={styles.failedTitle}>Payment Incomplete</Text>
            <Text style={styles.failedSubtitle}>
              {errorMessage || 'Your transaction was not completed. No money was deducted.'}
            </Text>

            <View style={styles.failedActions}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setPaymentFailed(false);
                  setLoading(true);
                  webViewRef.current?.reload();
                }}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelFailedBtn}
                onPress={() => {
                  setPaymentFailed(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.cancelFailedBtnText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  secureBadgeIcon: {
    fontSize: 12,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  refreshBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 14,
  },
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryPkgName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryLeads: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryGst: {
    fontSize: 10,
    color: colors.textMuted,
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    gap: 8,
  },
  loadingBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomHelpText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successCheckmark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  creditBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  creditLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  creditValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  creditHighlight: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  invoicePrimaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  invoicePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  leadsSecondaryBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  leadsSecondaryBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  failedModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  failedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  failedCross: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  failedTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  failedSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  failedActions: {
    width: '100%',
    gap: 10,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelFailedBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelFailedBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
