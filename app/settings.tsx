import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useDatabase } from '../src/hooks/useDatabase';
import { Card, Button } from '../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../src/constants/theme';
import { getCalendarSubscriptionUrl } from '../src/utils/calendarSync';
import { APP_VERSION } from '../src/constants/version';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();
  const [loading, setLoading] = useState(false);

  const handleSubscribeCalendar = async () => {
    try {
      setLoading(true);
      await db.syncCalendarNow();

      const url = getCalendarSubscriptionUrl('cristian');
      if (!url) {
        Alert.alert('Error', 'No se pudo generar la URL de suscripción.');
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        Linking.openURL(url);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al iniciar suscripción al calendario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendario de iPhone (iCloud) */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="calendar" size={22} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Calendario de iPhone (iCloud)</Text>
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-circle" size={13} color="#166534" />
                <Text style={styles.badgeSuccessText}>Sincronización Automática Activa</Text>
              </View>
            </View>
          </View>

          <Text style={styles.cardSubtitle}>
            Tus clases de matemáticas se reflejan automáticamente en el calendario oficial de tu iPhone con la hora exacta, el alumno asignado y el estado de cobro.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                Si añades o modificas una clase, el calendario se actualiza solo.
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                Muestra si la clase está cobrada o pendiente de cobro.
              </Text>
            </View>
          </View>

          <Button
            title={loading ? 'Conectando...' : '📲 Suscribir mi iPhone al Calendario'}
            onPress={handleSubscribeCalendar}
            disabled={loading}
          />
        </Card>

        {/* Versión de la Aplicación */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionTitle}>TutorApp v{APP_VERSION}</Text>
          <Text style={styles.versionSubtitle}>
            Gestión de clases particulares y calendario
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureList: {
    gap: 8,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  versionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  versionSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
});
