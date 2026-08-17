import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { location: string; specialty: string; minRating: number; verifiedOnly: boolean }) => void;
  initialLocation?: string;
  initialSpecialty?: string;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialLocation = 'All Locations',
  initialSpecialty = 'All Specialties',
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const locations = ['All Locations', 'Chandigarh', 'Mohali', 'Panchkula', 'Ludhiana'];
  const specialties = [
    'All Specialties',
    'Orthopaedics',
    'IVF & Fertility',
    'Cardiology',
    'Oncology',
    'Neurology',
    'Dental Surgery',
    'Dermatology',
  ];

  const handleApply = () => {
    onApply({
      location: selectedLocation,
      specialty: selectedSpecialty,
      minRating,
      verifiedOnly,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedLocation('All Locations');
    setSelectedSpecialty('All Specialties');
    setMinRating(0);
    setVerifiedOnly(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.content}>
          <View style={styles.handle} />
          
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filter Hospitals</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Location Section */}
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.chipRow}>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, selectedLocation === loc && styles.activeChip]}
                  onPress={() => setSelectedLocation(loc)}
                >
                  <Text style={[styles.chipText, selectedLocation === loc && styles.activeChipText]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Specialty Section */}
            <Text style={styles.sectionTitle}>Specialty</Text>
            <View style={styles.chipRow}>
              {specialties.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[styles.chip, selectedSpecialty === spec && styles.activeChip]}
                  onPress={() => setSelectedSpecialty(spec)}
                >
                  <Text style={[styles.chipText, selectedSpecialty === spec && styles.activeChipText]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minimum Rating */}
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.chipRow}>
              {[0, 4.0, 4.5, 4.8].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.chip, minRating === rate && styles.activeChip]}
                  onPress={() => setMinRating(rate)}
                >
                  <Text style={[styles.chipText, minRating === rate && styles.activeChipText]}>
                    {rate === 0 ? 'Any Rating' : `⭐ ${rate}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Verified Only Toggle */}
            <Text style={styles.sectionTitle}>Verification</Text>
            <TouchableOpacity
              style={[styles.checkboxRow, verifiedOnly && styles.checkboxRowActive]}
              onPress={() => setVerifiedOnly(!verifiedOnly)}
              activeOpacity={0.8}
            >
              <Text style={styles.checkboxIcon}>{verifiedOnly ? '☑️' : '⏹️'}</Text>
              <Text style={styles.checkboxLabel}>Show Verified Hospitals Only (NABH / Accredited)</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  resetText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  scrollArea: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeChipText: {
    color: colors.primary,
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxRowActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  checkboxIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  footer: {
    paddingTop: 12,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
});
