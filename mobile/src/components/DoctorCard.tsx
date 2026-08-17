import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Doctor } from '../types';
import { colors } from '../theme/colors';

interface DoctorCardProps {
  doctor: Doctor;
  onWriteReviewPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onWriteReviewPress }) => {
  const avatarUrl = doctor.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80';
  const [showReviews, setShowReviews] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(3);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{doctor.name}</Text>
          <Text style={styles.specialty}>{doctor.specialty || doctor.department}</Text>
          <Text style={styles.qualification}>{doctor.qualification}</Text>
          
          <View style={styles.metaRow}>
            {doctor.experience && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>🏅 {doctor.experience}</Text>
              </View>
            )}
            {doctor.rating && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {doctor.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {doctor.about && (
        <Text style={styles.aboutText} numberOfLines={2}>
          {doctor.about}
        </Text>
      )}

      {doctor.procedures && doctor.procedures.length > 0 && (
        <View style={styles.proceduresRow}>
          {doctor.procedures.map((p, idx) => (
            <View key={idx} style={styles.procedurePill}>
              <Text style={styles.procedureText}>✓ {p}</Text>
            </View>
          ))}
        </View>
      )}

      {onWriteReviewPress && (
        <TouchableOpacity style={styles.reviewBtn} onPress={onWriteReviewPress} activeOpacity={0.82}>
          <Text style={styles.reviewBtnText}>⭐ Write a Review</Text>
        </TouchableOpacity>
      )}

      {doctor.reviews && doctor.reviews.length > 0 && (
        <View style={styles.reviewsSection}>
          <TouchableOpacity
            style={styles.toggleReviewsBtn}
            onPress={() => {
              setShowReviews(!showReviews);
              if (showReviews) {
                setVisibleCount(3);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleReviewsText}>
              💬 Patient Reviews ({doctor.reviews.length}) {showReviews ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showReviews && (
            <View style={styles.reviewsList}>
              {doctor.reviews.slice(0, visibleCount).map((rev) => (
                <View key={rev.id || rev.patientName} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{rev.patientName}</Text>
                    <Text style={styles.reviewStars}>⭐ {rev.rating}/5</Text>
                  </View>
                  <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                  {rev.date && <Text style={styles.reviewDate}>{rev.date}</Text>}
                </View>
              ))}

              {doctor.reviews.length > visibleCount ? (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setVisibleCount((prev) => prev + 5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    Show More Reviews (+{doctor.reviews.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              ) : (
                visibleCount > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setVisibleCount(3)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>Show Less</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  qualification: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  aboutText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  proceduresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  procedurePill: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  procedureText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.info,
  },
  reviewBtn: {
    marginTop: 12,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  reviewsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  toggleReviewsBtn: {
    paddingVertical: 4,
  },
  toggleReviewsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewsList: {
    marginTop: 8,
    gap: 8,
  },
  reviewItem: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reviewStars: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewComment: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  reviewDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  showMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
