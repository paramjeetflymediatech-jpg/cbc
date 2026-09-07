import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSweetAlert } from '../../context/SweetAlertContext';

export const HospitalInvoiceScreen: React.FC<any> = ({ route, navigation }) => {
  const { subscriptionId, paymentId } = route?.params || {};
  const { showAlert } = useSweetAlert();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchInvoice = useCallback(async () => {
    try {
      const query = subscriptionId
        ? `?subscriptionId=${subscriptionId}`
        : paymentId
        ? `?paymentId=${paymentId}`
        : '';

      const res = await api.get(`/invoices${query}`);
      if (res.data?.success && res.data.invoice) {
        setInvoice(res.data.invoice);
      }
    } catch (err: any) {
      console.log('Error fetching invoice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subscriptionId, paymentId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoice();
  };

  const handleShare = async () => {
    if (!invoice) return;
    const inv = invoice;
    const message = `=================================\nTAX INVOICE - CLINICBYCHOICE\n=================================\nInvoice No: ${inv.invoiceNumber}\nDate: ${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}\n\nBILLED TO:\n${inv.buyer.hospitalName}\n${inv.buyer.city}, ${inv.buyer.state}\nGSTIN: ${inv.buyer.gstin}\n\nITEMS:\n- ${inv.items[0]?.name}\n  Qty: ${inv.items[0]?.quantity} Leads @ ₹${inv.items[0]?.unitRate}/lead\n  Taxable: ₹${inv.pricing.taxableAmount}\n  GST (18%): ₹${inv.pricing.totalGstAmount}\n  TOTAL: ₹${inv.pricing.totalAmount.toLocaleString('en-IN')}\n\nAmount in words: ${inv.pricing.amountInWords}\nPayment Mode: ${inv.payment.method}\nTransaction ID: ${inv.payment.transactionId}\nStatus: PAID (Success)\n=================================`;

    try {
      await Share.share({ message, title: `Tax Invoice ${inv.invoiceNumber}` });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print / Save PDF',
      `Invoice ${invoice?.invoiceNumber} generated. Use the Share button to export as PDF or send directly to your accounting department via Email / WhatsApp.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Invoice', onPress: handleShare },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Tax Invoice
        </Text>
        <TouchableOpacity style={styles.shareHeaderBtn} onPress={handleShare}>
          <Text style={styles.shareHeaderBtnText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating Tax Invoice...</Text>
        </View>
      ) : !invoice ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Invoice Not Found</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Printable Invoice Sheet */}
          <View style={styles.invoiceSheet}>
            {/* Sheet Top Header */}
            <View style={styles.invoiceHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyLogoText}>ClinicByChoice</Text>
                <Text style={styles.companyTagline}>{invoice.seller.tagline}</Text>
              </View>

              <View style={styles.invoiceMetaRight}>
                <View style={styles.taxInvoicePill}>
                  <Text style={styles.taxInvoicePillText}>ORIGINAL TAX INVOICE</Text>
                </View>
                <Text style={styles.invNumberText}>{invoice.invoiceNumber}</Text>
                <Text style={styles.invDateText}>
                  Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Paid Stamp */}
            <View style={styles.paidStampContainer}>
              <View style={styles.paidStamp}>
                <Text style={styles.paidStampText}>PAID ✓</Text>
                <Text style={styles.paidStampSub}>Verified Digital Payment</Text>
              </View>
            </View>

            {/* Billed By & Billed To Section */}
            <View style={styles.partiesGrid}>
              <View style={styles.partyBox}>
                <Text style={styles.partyRoleLabel}>BILLED BY (SUPPLIER)</Text>
                <Text style={styles.partyName}>{invoice.seller.companyName}</Text>
                <Text style={styles.partyAddress}>{invoice.seller.address}</Text>
                <Text style={styles.partyAddress}>{invoice.seller.city}, {invoice.seller.state} - {invoice.seller.pincode}</Text>
                <Text style={styles.partyGstin}>GSTIN: <Text style={{ fontWeight: '800' }}>{invoice.seller.gstin}</Text></Text>
                <Text style={styles.partyGstin}>PAN: {invoice.seller.pan}</Text>
              </View>

              <View style={styles.partyDivider} />

              <View style={styles.partyBox}>
                <Text style={styles.partyRoleLabel}>BILLED TO (HOSPITAL BUYER)</Text>
                <Text style={styles.partyName}>{invoice.buyer.hospitalName}</Text>
                <Text style={styles.partyAddress}>{invoice.buyer.address || 'Hospital Partner Campus'}</Text>
                <Text style={styles.partyAddress}>{invoice.buyer.city}{invoice.buyer.state ? `, ${invoice.buyer.state}` : ''}</Text>
                <Text style={styles.partyGstin}>GSTIN: <Text style={{ fontWeight: '800' }}>{invoice.buyer.gstin}</Text></Text>
                {invoice.buyer.phone ? <Text style={styles.partyGstin}>Phone: {invoice.buyer.phone}</Text> : null}
              </View>
            </View>

            {/* Line Items Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 2.5 }]}>Item & Description</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>SAC</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Rate (₹)</Text>
                <Text style={[styles.thText, { flex: 1.8, textAlign: 'right' }]}>Total (₹)</Text>
              </View>

              {invoice.items.map((item: any) => (
                <View key={item.id} style={styles.tableBodyRow}>
                  <View style={{ flex: 2.5 }}>
                    <Text style={styles.tdItemName}>{item.name}</Text>
                    <Text style={styles.tdItemDesc}>{item.description}</Text>
                  </View>
                  <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{item.sacCode}</Text>
                  <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.tdText, { flex: 1.5, textAlign: 'right' }]}>₹{item.unitRate}</Text>
                  <Text style={[styles.tdTextBold, { flex: 1.8, textAlign: 'right' }]}>
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calculations & Taxes Summary */}
            <View style={styles.taxSummaryContainer}>
              <View style={styles.wordsCol}>
                <Text style={styles.wordsHeading}>AMOUNT IN WORDS</Text>
                <Text style={styles.wordsText}>"{invoice.pricing.amountInWords}"</Text>

                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.pmTitle}>PAYMENT AUDIT</Text>
                  <Text style={styles.pmText}>Method: <Text style={{ fontWeight: '700' }}>{invoice.payment.method}</Text></Text>
                  <Text style={styles.pmText}>Txn Ref: <Text style={styles.monoTxn}>{invoice.payment.transactionId}</Text></Text>
                  <Text style={styles.pmText}>
                    Paid On: {new Date(invoice.payment.paidAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.totalsCol}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Taxable Base Value:</Text>
                  <Text style={styles.totalVal}>₹{invoice.pricing.taxableAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST (9.0%):</Text>
                  <Text style={styles.totalVal}>₹{invoice.pricing.cgstAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST (9.0%):</Text>
                  <Text style={styles.totalVal}>₹{invoice.pricing.sgstAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>TOTAL INVOICE:</Text>
                  <Text style={styles.grandTotalVal}>
                    ₹{invoice.pricing.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Terms & Authorization */}
            <View style={styles.invoiceFooter}>
              <View style={styles.termsCol}>
                <Text style={styles.termsHeading}>TERMS & CONDITIONS</Text>
                <Text style={styles.termsText}>
                  1. Digital patient lead credits are valid per plan validity and credited instantly upon confirmation.
                </Text>
                <Text style={styles.termsText}>
                  2. This is a computer-generated tax invoice and requires no physical signature under Indian IT Act.
                </Text>
              </View>

              <View style={styles.signatureCol}>
                <Text style={styles.signLabel}>FOR CLINICBYCHOICE TECH</Text>
                <View style={styles.digitalSignBox}>
                  <Text style={styles.digitalSignText}>[DIGITALLY AUTHORIZED]</Text>
                  <Text style={styles.digitalSignSub}>Authorized Signatory</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Toolbar */}
          <View style={styles.actionToolbar}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Text style={styles.printBtnText}>🖨️ Print / Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={handleShare}>
              <Text style={styles.shareActionBtnText}>📤 Share Tax Invoice</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  shareHeaderBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  backHomeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  invoiceSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 14,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderColor: colors.primary,
    paddingBottom: 12,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  companyTagline: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 180,
  },
  invoiceMetaRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  taxInvoicePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  taxInvoicePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  invNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  invDateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  paidStampContainer: {
    alignItems: 'center',
    marginVertical: -6,
  },
  paidStamp: {
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
  },
  paidStampText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 1,
  },
  paidStampSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#166534',
  },
  partiesGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partyBox: {
    flex: 1,
    gap: 2,
  },
  partyRoleLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  partyAddress: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  partyGstin: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  partyDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
  },
  thText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  tdItemName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tdItemDesc: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 13,
  },
  tdText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tdTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  taxSummaryContainer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 12,
  },
  wordsCol: {
    flex: 1.1,
    gap: 6,
  },
  wordsHeading: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  wordsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  paymentMethodInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
    marginTop: 4,
  },
  pmTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
  },
  pmText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  monoTxn: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#0F766E',
  },
  totalsCol: {
    flex: 1,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
  },
  grandTotalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  invoiceFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 10,
    gap: 12,
  },
  termsCol: {
    flex: 1.3,
    gap: 2,
  },
  termsHeading: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  termsText: {
    fontSize: 8,
    color: colors.textMuted,
    lineHeight: 11,
  },
  signatureCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  signLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.textMuted,
  },
  digitalSignBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 4,
  },
  digitalSignText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.primary,
  },
  digitalSignSub: {
    fontSize: 7,
    color: colors.textMuted,
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: 10,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shareActionBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
