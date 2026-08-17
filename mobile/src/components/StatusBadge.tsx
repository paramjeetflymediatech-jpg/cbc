import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LeadStatus } from '../types';
import { colors } from '../theme/colors';

interface StatusBadgeProps {
  status: LeadStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = colors.surfaceSecondary;
  let textColor = colors.textSecondary;
  let dotColor = colors.textMuted;

  switch (status) {
    case 'Request Received':
      bgColor = colors.infoLight;
      textColor = colors.info;
      dotColor = colors.info;
      break;
    case 'Submitted':
      bgColor = '#F3E8FF';
      textColor = '#7E22CE';
      dotColor = '#7E22CE';
      break;
    case 'Contacted':
      bgColor = colors.warningLight;
      textColor = colors.warning;
      dotColor = colors.warning;
      break;
    case 'In Progress':
      bgColor = colors.primaryLight;
      textColor = colors.primary;
      dotColor = colors.primary;
      break;
    case 'Completed':
      bgColor = colors.successLight;
      textColor = colors.success;
      dotColor = colors.success;
      break;
    case 'Cancelled':
      bgColor = colors.errorLight;
      textColor = colors.error;
      dotColor = colors.error;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
