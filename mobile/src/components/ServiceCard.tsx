import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Service } from '../types';
import { colors } from '../theme/colors';

/**
 * Converts HTML from the rich-text editor to clean plain text.
 * Block-level elements are converted to newlines so words don't
 * smash together after tag removal.
 */
const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/(p|h[1-6]|li|div|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  variant?: 'compact' | 'full';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress, variant = 'compact' }) => {
  if (variant === 'full') {
    const treatments = service.popularTreatments || [];
    const imageUrl = service.image || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80';

    return (
      <TouchableOpacity style={styles.fullCardContainer} onPress={onPress} activeOpacity={0.88}>
        {/* Top Image Banner with Category Badge */}
        <View style={styles.imageBannerWrapper}>
          <Image source={{ uri: imageUrl }} style={styles.bannerImage} />
          <View style={styles.imageOverlayGradient} />
          
          <View style={styles.topBadgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{service.category || 'Specialist Care'}</Text>
            </View>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{service.icon || '🩺'}</Text>
            </View>
          </View>
        </View>

        {/* Card Content Area */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle}>{service.name}</Text>
            <Text style={styles.verifiedTag}>✓ Verified</Text>
          </View>

          {service.description ? (
            <Text style={styles.serviceDesc} numberOfLines={2}>
              {stripHtml(service.description)}
            </Text>
          ) : null}

          {/* Popular Treatment Pills */}
          {treatments.length > 0 && (
            <View style={styles.treatmentWrap}>
              {treatments.slice(0, 3).map((t, idx) => (
                <View key={idx} style={styles.treatmentPill}>
                  <Text style={styles.treatmentPillText}>• {t}</Text>
                </View>
              ))}
              {treatments.length > 3 && (
                <View style={styles.moreTreatmentsPill}>
                  <Text style={styles.moreTreatmentsText}>+{treatments.length - 3} more</Text>
                </View>
              )}
            </View>
          )}

          {/* Card Footer Bar */}
          <View style={styles.cardFooter}>
            <View style={styles.infoCol}>
              <Text style={styles.infoCountText}>
                {treatments.length > 0 ? `${treatments.length} Procedures` : 'Expert Care'}
              </Text>
              <Text style={styles.infoSubText}>NABH Partner Hospitals</Text>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Explore Specialty →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.compactIconContainer}>
        <Text style={styles.compactIconText}>{service.icon || '🩺'}</Text>
      </View>
      <Text style={styles.compactServiceName} numberOfLines={1}>
        {service.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactCard: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactIconText: {
    fontSize: 22,
  },
  compactServiceName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fullCardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageBannerWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.secondary,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.textPrimary,
    flex: 1,
  },
  verifiedTag: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  treatmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  treatmentPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  treatmentPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  moreTreatmentsPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  moreTreatmentsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  infoCol: {
    justifyContent: 'center',
  },
  infoCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoSubText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
  },
});
