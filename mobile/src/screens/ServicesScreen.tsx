import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Service } from '../types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { ServiceCard } from '../components/ServiceCard';
import { EmptyState } from '../components/EmptyState';

import { useEffect } from 'react';
import api from '../services/api';

interface ServicesScreenProps {
  navigation: any;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/services');
      if (res.data && Array.isArray(res.data.services)) {
        setServices(res.data.services);
      } else if (Array.isArray(res.data)) {
        setServices(res.data);
      } else {
        setServices([]);
      }
    } catch (e) {
      console.log('Error fetching services:', e);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const listToFilter = services;

  // Dynamically extract categories from loaded database services
  const dbCategories = Array.from(new Set(listToFilter.map((s) => s.category).filter((c): c is string => Boolean(c))));
  const categories = [
    'All',
    ...dbCategories,
  ];

  const filteredServices = listToFilter.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.popularTreatments && s.popularTreatments.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      activeCategoryFilter === 'All' ||
      s.category === activeCategoryFilter ||
      (s.category && s.category.toLowerCase() === activeCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Healthcare</Text>
        <Text style={styles.subtitle}>Discover accredited medical specialties, procedures & providers</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search specialty e.g. Knee, IVF, Heart, LASIK..."
        />
      </View>

      {/* Category Filter Chips Bar */}
      <View style={styles.categoryFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategoryFilter === cat && styles.catChipActive]}
              onPress={() => setActiveCategoryFilter(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catChipText, activeCategoryFilter === cat && styles.catChipTextActive]}>
                {cat === 'All' ? 'All Specialties' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sub-Header Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>Specialist Healthcare Directory</Text>
          <Text style={styles.infoBannerText}>
            Direct access to leading hospital departments, expert surgeons, and comprehensive cost estimates.
          </Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>
          {activeCategoryFilter === 'All' ? 'Medical Specialties' : activeCategoryFilter} ({filteredServices.length})
        </Text>

        <View style={styles.listContainer}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service: Service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="full"
                onPress={() => navigation.navigate('ServiceDetail', { service })}
              />
            ))
          ) : (
            <EmptyState
              icon="🩺"
              title="No Specialties Found"
              description={`No medical specialties match "${searchQuery}". Try searching for Orthopaedics, IVF, Cardiology or Dental.`}
              buttonText="Reset Search"
              onButtonPress={() => {
                setSearchQuery('');
                setActiveCategoryFilter('All');
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchPadding: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  categoryFilterBar: {
    backgroundColor: colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.textWhite,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  listContainer: {},
});
