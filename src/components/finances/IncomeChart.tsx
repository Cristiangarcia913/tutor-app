import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, formatCurrency } from '../../constants/theme';

interface MonthlyIncomeItem {
  month: string; // e.g. "2026-05" or "May"
  amount: number;
}

interface IncomeChartProps {
  data: MonthlyIncomeItem[];
  title?: string;
}

export default function IncomeChart({ data, title = 'Evolución de Ingresos' }: IncomeChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sin datos de ingresos aún</Text>
        </View>
      </View>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const CHART_HEIGHT = 140;

  // Format month to short label (e.g. "2026-10" -> "Oct" or take as is)
  const formatMonthLabel = (m: string): string => {
    if (m.includes('-')) {
      const parts = m.split('-');
      const monthNum = parseInt(parts[1], 10);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months[monthNum - 1] || m;
    }
    return m.substring(0, 3);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.totalText}>
          Total: {formatCurrency(data.reduce((acc, curr) => acc + curr.amount, 0))}
        </Text>
      </View>

      <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
        {data.map((item, index) => {
          const heightPercent = Math.max((item.amount / maxAmount) * 100, 4);
          const isLatest = index === data.length - 1;

          return (
            <View key={item.month || index} style={styles.barColumn}>
              <Text style={styles.barAmount} numberOfLines={1}>
                {item.amount > 0 ? `${Math.round(item.amount)}€` : '0'}
              </Text>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isLatest ? Colors.primary : Colors.primaryLight,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.barLabel,
                  isLatest && styles.barLabelActive,
                ]}
                numberOfLines={1}
              >
                {formatMonthLabel(item.month)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  totalText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barAmount: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 6,
    fontWeight: '500',
  },
  barLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
