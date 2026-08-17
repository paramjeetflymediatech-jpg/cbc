import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import api from '../services/api';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { PlaceSuggestion } from '../types';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ visible, onClose }) => {
  const { location, setLocation } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setSearchingSuggestions(false);
      return;
    }

    setSearchingSuggestions(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get('/locations/autocomplete', {
          params: { q: searchQuery.trim() },
        });
        if (res.data && Array.isArray(res.data.suggestions)) {
          setSuggestions(res.data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        setSuggestions([]);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setSearchingSuggestions(true);
    try {
      let finalAddress = suggestion.address;
      
      if (suggestion.place_id && (!suggestion.lat || !suggestion.lon || !suggestion.address || Object.keys(suggestion.address).length === 0)) {
        const res = await api.get('/locations/details', {
          params: { place_id: suggestion.place_id },
        });
        if (res.data && res.data.address) {
          finalAddress = res.data.address;
        }
      }

      if (finalAddress) {
        const city = finalAddress.city || 
                     finalAddress.town || 
                     finalAddress.village || 
                     finalAddress.county || 
                     finalAddress.state || 
                     'Chandigarh';
        
        const road = finalAddress.road || finalAddress.suburb || '';
        const locationString = road ? `${road.split(',')[0]}, ${city}` : city;
        
        await setLocation(locationString);
        onClose();
      } else {
        const displayNameParts = suggestion.display_name.split(',');
        const locationString = displayNameParts.slice(0, 2).join(',').trim();
        await setLocation(locationString);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting suggestion:', error);
      const displayNameParts = suggestion.display_name.split(',');
      const locationString = displayNameParts.slice(0, 2).join(',').trim();
      await setLocation(locationString);
      onClose();
    } finally {
      setSearchingSuggestions(false);
      setSearchQuery('');
    }
  };

  const popularCities = [
    { name: 'Chandigarh Tricity', region: 'Chandigarh, Mohali, Panchkula' },
    { name: 'Ludhiana', region: 'Punjab' },
    { name: 'Amritsar', region: 'Punjab' },
    { name: 'Jalandhar', region: 'Punjab' },
    { name: 'Delhi NCR', region: 'Gurugram, Noida, Delhi' },
    { name: 'Mumbai', region: 'Maharashtra' },
    { name: 'Bengaluru', region: 'Karnataka' },
    { name: 'Hyderabad', region: 'Telangana' },
  ];

  const filteredCities = popularCities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCity = async (cityName: string) => {
    await setLocation(cityName);
    onClose();
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'ClinicByChoice needs access to your location to find nearby clinics and hospitals.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleDetectCurrentLocation = async () => {
    setDetectingGps(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setDetectingGps(false);
      Alert.alert('Permission Denied', 'Please enable location permissions in your settings to use this feature.');
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.get('/locations/reverse', {
            params: {
              lat: latitude,
              lon: longitude,
            },
          });
          
          if (res.data) {
            const city = res.data.address?.city || 
                         res.data.address?.town || 
                         res.data.address?.village || 
                         res.data.address?.county || 
                         res.data.address?.state || 
                         'Chandigarh';
            
            const road = res.data.address?.road || res.data.address?.suburb || '';
            const locationString = road ? `${road.split(',')[0]}, ${city}` : city;
            
            await setLocation(locationString);
            onClose();
          } else {
            throw new Error('No data received');
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
          await setLocation('Sector 17, Chandigarh');
          onClose();
        } finally {
          setDetectingGps(false);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        Alert.alert('Location Error', 'Failed to detect your current location. Please try selecting a city manually.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdropPressable} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Location GPS Button */}
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleDetectCurrentLocation}
            disabled={detectingGps}
            activeOpacity={0.85}
          >
            {detectingGps ? (
              <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 10 }} />
            ) : (
              <Text style={styles.gpsIcon}>🎯</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>Use Current Location</Text>
              <Text style={styles.gpsSubtitle}>Detect via GPS for nearest hospitals & clinics</Text>
            </View>
            <Text style={styles.gpsArrow}>→</Text>
          </TouchableOpacity>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search city, area, or pincode..."
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {searchQuery.trim().length < 2 ? (
            <>
              <Text style={styles.sectionHeading}>Popular Cities & Regions</Text>
              <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
                {filteredCities.map((city, idx) => {
                  const isSelected = location.toLowerCase().includes(city.name.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                      onPress={() => handleSelectCity(city.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cityPin}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                          {city.name}
                        </Text>
                        <Text style={styles.cityRegion}>{city.region}</Text>
                      </View>
                      {isSelected && <Text style={styles.selectedCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.sectionHeading}>Search Results</Text>
              <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
                {searchingSuggestions ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loaderText}>Searching places...</Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  suggestions.map((item) => {
                    const nameParts = item.display_name.split(',');
                    const title = nameParts[0].trim();
                    const subtitle = nameParts.slice(1).join(',').trim();

                    return (
                      <TouchableOpacity
                        key={item.place_id}
                        style={styles.cityRow}
                        onPress={() => handleSelectSuggestion(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cityPin}>📍</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cityName}>{title}</Text>
                          {subtitle ? (
                            <Text style={styles.cityRegion} numberOfLines={1}>
                              {subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No places found</Text>
                    <TouchableOpacity
                      style={styles.customCityRow}
                      onPress={() => handleSelectCity(searchQuery.trim())}
                    >
                      <Text style={styles.cityPin}>🔍</Text>
                      <Text style={styles.customCityText}>Select "{searchQuery.trim()}"</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.25)',
  },
  gpsIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  gpsArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 6,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  citiesList: {
    maxHeight: 300,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  cityRowSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  cityPin: {
    fontSize: 16,
    marginRight: 12,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityNameSelected: {
    color: colors.primary,
    fontWeight: '900',
  },
  cityRegion: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  selectedCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  customCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginTop: 8,
  },
  customCityText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 8,
  },
  loaderContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textMuted,
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 10,
  },
});
