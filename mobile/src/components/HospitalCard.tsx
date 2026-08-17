import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Hospital } from '../types';
import { colors } from '../theme/colors';

interface HospitalCardProps {
  hospital: Hospital;
  onPress: () => void;
  onEnquirePress?: () => void;
  onBookmarkPress?: () => void;
  isSaved?: boolean;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  onPress,
  onEnquirePress,
  onBookmarkPress,
  isSaved = false,
}) => {
  const imageUrl = hospital.image || (hospital as any).coverImage || (hospital as any).logo || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80';

  const rawSpecialties = Array.isArray(hospital.specialties)
    ? hospital.specialties
    : Array.isArray((hospital as any).hospitalServices)
    ? (hospital as any).hospitalServices.map((hs: any) => hs.service?.name).filter(Boolean)
    : [];

  const specialties = rawSpecialties.length > 0 ? rawSpecialties : ['Multi-Specialty', 'Super Speciality'];
  const ratingVal = typeof hospital.rating === 'number' ? hospital.rating : 4.8;
  const isVerifiedBadge = hospital.isVerified || (hospital as any).isNabhAccredited || (hospital as any).isVerifiedPartner;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Rating Floating Pill */}
        <View style={styles.ratingBadge}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.ratingText}>{ratingVal.toFixed(1)}</Text>
          {hospital.reviewCount ? <Text style={styles.reviewCount}>({hospital.reviewCount})</Text> : null}
        </View>

        {/* Favorite Heart Button */}
        {onBookmarkPress && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onBookmarkPress} activeOpacity={0.8}>
            <Text style={styles.heartIcon}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {hospital.name}
          </Text>
          {isVerifiedBadge && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {hospital.location || hospital.city || 'India'}
          </Text>
        </View>

        {/* Specialty Tag Pills */}
        <View style={styles.specialtyContainer}>
          {specialties.slice(0, 3).map((spec: string, index: number) => (
            <View key={index} style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>{spec}</Text>
            </View>
          ))}
          {specialties.length > 3 && (
            <View style={styles.specialtyPillMore}>
              <Text style={styles.specialtyTextMore}>+{specialties.length - 3}</Text>
            </View>
          )}
        </View>

        {hospital.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {hospital.description}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>View Hospital</Text>
          </TouchableOpacity>

          {onEnquirePress && (
            <TouchableOpacity style={styles.primaryButton} onPress={onEnquirePress} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Enquire Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    height: 155,
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    color: '#FCD34D',
    fontWeight: '800',
    fontSize: 13,
    marginRight: 4,
  },
  reviewCount: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  contentContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedCheck: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '900',
    marginRight: 3,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  specialtyPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  specialtyPillMore: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyTextMore: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textWhite,
  },
});
