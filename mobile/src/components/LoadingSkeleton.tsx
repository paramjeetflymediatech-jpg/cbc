import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface LoadingSkeletonProps {
  type?: 'card' | 'service' | 'list' | 'detail';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card' }) => {
  if (type === 'service') {
    return (
      <View style={styles.serviceSkeletonContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.serviceBox} />
        ))}
      </View>
    );
  }

  if (type === 'list') {
    return (
      <View style={styles.listSkeleton}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.listItem} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.textLineLong} />
      <View style={styles.textLineShort} />
      <View style={styles.buttonPlaceholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 14,
  },
  textLineLong: {
    width: '80%',
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 8,
  },
  textLineShort: {
    width: '45%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 14,
  },
  buttonPlaceholder: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  serviceSkeletonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  listSkeleton: {
    gap: 12,
  },
  listItem: {
    height: 70,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
});
