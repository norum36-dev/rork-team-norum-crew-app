import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionProfile } from '@/types/nutrition';
import { getBaselineHourlyTargets } from '@/utils/nutrition-calculator';

interface NutritionSummaryProps {
  planned: NutritionProfile;
  actual: NutritionProfile;
  title: string;
  phPowderActive?: boolean;
}

export function NutritionSummary({ planned, actual, title, phPowderActive = false }: NutritionSummaryProps) {
  const baselineTargets = getBaselineHourlyTargets(phPowderActive);
  
  const getPercentage = (actual: number, baseline: number) => {
    if (baseline === 0) return 0;
    return Math.round((actual / baseline) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return '#10B981';
    if (percentage >= 80 && percentage <= 120) return '#F59E0B';
    return '#EF4444';
  };

  const NutrientRow = ({ 
    label, 
    unit, 
    plannedValue, 
    actualValue 
  }: { 
    label: string; 
    unit: string; 
    plannedValue: number; 
    actualValue: number; 
  }) => {
    const percentage = getPercentage(actualValue, plannedValue);
    const color = getStatusColor(percentage);

    return (
      <View style={styles.nutrientRow}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <View style={styles.nutrientValues}>
          <Text style={styles.actualValue}>
            {actualValue.toFixed(1)}{unit}
          </Text>
          <Text style={styles.separator}>/</Text>
          <Text style={styles.plannedValue}>
            {plannedValue.toFixed(1)}{unit}
          </Text>
          <Text style={[styles.percentage, { color }]}>
            ({percentage}%)
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <NutrientRow
        label="Karbohydrater"
        unit="g"
        plannedValue={baselineTargets.carbs}
        actualValue={actual.carbs}
      />
      
      <NutrientRow
        label="Natrium"
        unit="mg"
        plannedValue={baselineTargets.sodium}
        actualValue={actual.sodium}
      />
      
      <NutrientRow
        label="Væske"
        unit="ml"
        plannedValue={baselineTargets.fluid}
        actualValue={actual.fluid}
      />
      
      {(planned.protein || 0) > 0 && (
        <NutrientRow
          label="Protein"
          unit="g"
          plannedValue={planned.protein || 0}
          actualValue={actual.protein || 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  nutrientValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actualValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  separator: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  plannedValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '500',
  },
});