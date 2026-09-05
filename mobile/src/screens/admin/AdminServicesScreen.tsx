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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';

interface AdminServicesScreenProps {
  navigation: any;
}

interface SpecialtyServiceItem {
  id: number;
  name: string;
  slug: string;
  category?: string | null;
  parentId?: number | null;
  shortDescription?: string | null;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  parent?: { id: number; name: string; slug: string } | null;
  subServices?: { id: number; name: string; slug: string }[] | null;
  popularTreatments?: string[] | null;
}

const htmlToPlainText = (html?: string | null): string => {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|h[1-6]|blockquote|section|article)>/gi, ' ')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<hr\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const AdminServicesScreen: React.FC<AdminServicesScreenProps> = ({ navigation }) => {
  const [services, setServices] = useState<SpecialtyServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [icon, setIcon] = useState<string>('🩺');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/admin/services');
      if (res.data?.services && Array.isArray(res.data.services)) {
        setServices(res.data.services);
      } else {
        const fallback = await api.get('/services');
        if (fallback.data?.services && Array.isArray(fallback.data.services)) {
          setServices(fallback.data.services);
        }
      }
    } catch (err) {
      console.log('Error fetching services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setCategory('');
    setIcon('🩺');
    setShortDescription('');
    setDescription('');
    setSeoTitle('');
    setSeoDescription('');
    setStatus('ACTIVE');
    setModalVisible(true);
  };

  const handleOpenEdit = (svc: SpecialtyServiceItem) => {
    setEditingId(svc.id);
    setName(svc.name || '');
    setSlug(svc.slug || '');
    setCategory(svc.category || '');
    setIcon(svc.icon || '🩺');
    setShortDescription(svc.shortDescription || '');
    setDescription(svc.description || '');
    setSeoTitle(svc.seoTitle || '');
    setSeoDescription(svc.seoDescription || '');
    setStatus(svc.status || 'ACTIVE');
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Specialty name is required.');
      return;
    }

    try {
      setSaving(true);
      const generatedSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const payload = {
        name: name.trim(),
        slug: generatedSlug,
        category: category.trim() || undefined,
        icon: icon.trim() || '🩺',
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        status,
      };

      if (editingId === null) {
        // Create new service
        await api.post('/admin/services', payload);
        Alert.alert('Success', `Medical specialty "${name}" created successfully.`);
      } else {
        // Update existing service
        await api.put('/admin/services', {
          id: editingId,
          ...payload,
        });
        Alert.alert('Saved', `Specialty "${name}" updated successfully.`);
      }

      setModalVisible(false);
      fetchServices();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save specialty details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = (svc: SpecialtyServiceItem) => {
    Alert.alert(
      'Delete Specialty',
      `Are you sure you want to delete "${svc.name}"? Hospitals linked to this specialty will also be unlinked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/services?id=${svc.id}`);
              Alert.alert('Deleted', `Specialty "${svc.name}" has been deleted.`);
              fetchServices();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete specialty.');
            }
          },
        },
      ]
    );
  };

  // Categories extraction for filter bar
  const categoriesList = ['ALL', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[]];

  const filteredServices = services.filter((svc) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      svc.name?.toLowerCase().includes(q) ||
      svc.slug?.toLowerCase().includes(q) ||
      svc.category?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'ALL' || svc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Medical Specialties</Text>
          <Text style={styles.headerSub}>{services.length} Platform Specialties</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search specialty, category, slug..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills Strip */}
      {categoriesList.length > 1 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {categoriesList.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.filterPillText, selectedCategory === cat && styles.filterPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading medical specialties...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filteredServices.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyTitle}>No specialties found</Text>
              <Text style={styles.emptySub}>Try searching with different keywords or add a new specialty.</Text>
            </View>
          ) : (
            filteredServices.map((svc) => {
              const plainSummary = htmlToPlainText(svc.shortDescription || svc.description);
              const isActive = svc.status === 'ACTIVE';

              return (
                <View key={svc.id} style={styles.serviceCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                      <Text style={styles.icon}>{svc.icon || '🩺'}</Text>
                    </View>
                    <View style={styles.titleCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        {svc.category && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{svc.category}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.serviceSlug}>/{svc.slug}</Text>
                    </View>

                    <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                        {svc.status || 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  {/* Clean Formatted Description Text */}
                  {plainSummary ? (
                    <Text style={styles.desc} numberOfLines={3}>
                      {plainSummary}
                    </Text>
                  ) : null}

                  {/* Action Buttons Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(svc)}>
                      <Text style={styles.editBtnText}>✏️ Edit Specialty & Content</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteService(svc)}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT SPECIALTY MODAL */}
      {/* ======================================================== */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>
                {editingId !== null ? 'Edit Medical Specialty' : 'Add Medical Specialty'}
              </Text>
              <Text style={styles.modalHeaderSub}>Platform Specialty & Clinical Scope</Text>
            </View>
            <TouchableOpacity onPress={handleSaveService} disabled={saving}>
              <Text style={[styles.modalDoneText, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Status Option */}
            <Text style={styles.formLabel}>Specialty Visibility Status</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.roleOption, status === st && styles.roleOptionActive]}
                  onPress={() => setStatus(st)}
                >
                  <Text style={[styles.roleOptionText, status === st && styles.roleOptionTextActive]}>
                    {st === 'ACTIVE' ? '✓ ACTIVE (Visible to Patients)' : '✕ INACTIVE (Hidden)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Specialty Name */}
            <Text style={styles.formLabel}>Specialty Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Cardiology & Cardiac Surgery"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (editingId === null) {
                  setSlug(
                    text
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '')
                  );
                }
              }}
            />

            {/* URL Slug & Icon Grid */}
            <View style={styles.formGridRow}>
              <View style={[styles.formGridCol, { flex: 2 }]}>
                <Text style={styles.formLabel}>URL Slug</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. cardiology"
                  placeholderTextColor={colors.textMuted}
                  value={slug}
                  onChangeText={setSlug}
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.formGridCol, { flex: 1 }]}>
                <Text style={styles.formLabel}>Icon Symbol</Text>
                <TextInput
                  style={[styles.formInput, { textAlign: 'center', fontSize: 18 }]}
                  placeholder="🩺"
                  value={icon}
                  onChangeText={setIcon}
                />
              </View>
            </View>

            {/* Category */}
            <Text style={styles.formLabel}>Category / Medical Department</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Surgical Care, Oncology, Dental Care..."
              placeholderTextColor={colors.textMuted}
              value={category}
              onChangeText={setCategory}
            />

            {/* Short Description */}
            <Text style={styles.formLabel}>Short Summary (Card Preview)</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 56 }]}
              placeholder="Brief overview displayed on search cards and hospital pages..."
              placeholderTextColor={colors.textMuted}
              value={shortDescription}
              onChangeText={setShortDescription}
              multiline
            />

            {/* Rich Text Editor for Full Description */}
            <Text style={styles.formLabel}>Full Clinical Description & Treatments Overview</Text>
            <Text style={styles.formSubLabel}>
              Rich formatted text with Headings, Bold, Italic, Lists, and Live HTML Preview
            </Text>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write detailed medical specialty overview, common procedures, hospital care standards..."
              minHeight={180}
            />

            {/* SEO Title & Meta Description */}
            <Text style={[styles.formLabel, { marginTop: 16 }]}>SEO Page Title</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Best Cardiology Hospitals & Doctors in India | ClinicByChoice"
              placeholderTextColor={colors.textMuted}
              value={seoTitle}
              onChangeText={setSeoTitle}
            />

            <Text style={styles.formLabel}>SEO Meta Description</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 60 }]}
              placeholder="Find top accredited cardiac hospitals, compare heart surgery costs, and book consultations..."
              placeholderTextColor={colors.textMuted}
              value={seoDescription}
              onChangeText={setSeoDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveService}
              disabled={saving}
            >
              <Text style={styles.saveSubmitBtnText}>
                {saving
                  ? 'Saving Specialty...'
                  : editingId !== null
                  ? 'Save Specialty Changes ✓'
                  : 'Create Medical Specialty ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.textWhite,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  titleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E22CE',
  },
  serviceSlug: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#DC2626',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modalHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleOptionTextActive: {
    color: colors.textWhite,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: 10,
  },
  formSubLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
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
  formGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGridCol: {
    flex: 1,
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  saveSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});
