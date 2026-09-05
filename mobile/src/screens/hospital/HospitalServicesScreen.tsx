import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';

interface HospitalServicesScreenProps {
  navigation: any;
}

export const HospitalServicesScreen: React.FC<HospitalServicesScreenProps> = ({ navigation }) => {
  const [allServices, setAllServices] = useState<any[]>([]);
  const [hospitalServices, setHospitalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edit Service Offering Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [startingPrice, setStartingPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/hospital/services');
      if (res.data) {
        if (Array.isArray(res.data.allPlatformServices)) {
          setAllServices(res.data.allPlatformServices);
        }
        if (Array.isArray(res.data.hospitalServices)) {
          setHospitalServices(res.data.hospitalServices);
        }
      }
    } catch (err) {
      console.log('Error loading hospital services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const isOffered = (serviceId: number | string) => {
    return hospitalServices.some(
      (hs) => Number(hs.serviceId) === Number(serviceId) && hs.status === 'ACTIVE'
    );
  };

  const getHospitalServiceRecord = (serviceId: number | string) => {
    return hospitalServices.find((hs) => Number(hs.serviceId) === Number(serviceId));
  };

  const openEditModal = (service: any) => {
    const existing = getHospitalServiceRecord(service.id);
    setSelectedService(service);
    setStartingPrice(existing?.startingPrice ? String(existing.startingPrice) : '');
    setDescription(existing?.description || '');
    setModalVisible(true);
  };

  const toggleService = async (service: any) => {
    const currentlyActive = isOffered(service.id);
    const newStatus = currentlyActive ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.post('/hospital/services', {
        serviceId: service.id,
        status: newStatus,
      });
      if (res.data?.hospitalService) {
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update service offering.');
    }
  };

  const handleSaveOffering = async () => {
    if (!selectedService) return;
    try {
      setSaving(true);
      const res = await api.post('/hospital/services', {
        serviceId: selectedService.id,
        startingPrice: startingPrice.trim() ? Number(startingPrice) : null,
        description: description.trim() || null,
        status: 'ACTIVE',
      });
      if (res.data?.hospitalService) {
        setModalVisible(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save service details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Specialties</Text>
        <View style={styles.headerRight}>
          <Text style={styles.activeCountText}>
            {hospitalServices.filter((hs) => hs.status === 'ACTIVE').length} Active
          </Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading specialties...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Info Card */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🩺</Text>
            <Text style={styles.infoText}>
              Toggle specialties active to receive direct patient consultation requests for specific departments.
            </Text>
          </View>

          {allServices.map((service) => {
            const active = isOffered(service.id);
            const hsRecord = getHospitalServiceRecord(service.id);

            return (
              <View key={service.id} style={[styles.serviceCard, active && styles.serviceCardActive]}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceTitleCol}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {hsRecord?.startingPrice ? (
                      <Text style={styles.priceTag}>
                        Starting from ₹{Number(hsRecord.startingPrice).toLocaleString('en-IN')}
                      </Text>
                    ) : (
                      <Text style={styles.noPriceTag}>Standard Pricing</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.toggleBtn, active ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                    onPress={() => toggleService(service)}
                  >
                    <Text style={[styles.toggleBtnText, active ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                      {active ? '✓ Offered' : '+ Enable'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {active && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editPriceBtn}
                      onPress={() => openEditModal(service)}
                    >
                      <Text style={styles.editPriceText}>
                        ⚙️ Configure Price & Treatment Info →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Edit Service Offering Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure {selectedService?.name}</Text>
            <Text style={styles.modalSub}>Customize estimated starting costs and patient info</Text>

            <Text style={styles.formLabel}>Estimated Starting Price (₹ INR)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 25000"
              placeholderTextColor={colors.textMuted}
              value={startingPrice}
              onChangeText={setStartingPrice}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Specialty Description / Highlights</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="e.g. State of the art robotic surgery available, cashless insurance accepted..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveOffering}
                disabled={saving}
              >
                <Text style={styles.modalSaveBtnText}>
                  {saving ? 'Saving...' : 'Save Offering ✓'}
                </Text>
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
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerRight: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceCardActive: {
    borderColor: 'rgba(253, 29, 116, 0.3)',
    backgroundColor: '#FFF9FB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  noPriceTag: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnInactive: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toggleBtnTextActive: {
    color: colors.textWhite,
  },
  toggleBtnTextInactive: {
    color: colors.textSecondary,
  },
  cardActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  editPriceBtn: {
    paddingVertical: 4,
  },
  editPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    marginTop: 2,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textWhite,
  },
});
