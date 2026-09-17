import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Award, Clock, Download, Lock } from 'lucide-react-native';

import { Banner, Button, ProgressBar } from '../components/ui';
import { CertificateViewer } from '../components/certificate/CertificateViewer';
import { colors } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { useCertificateStore } from '../store/useCertificateStore';
import type { CertificateLevel } from '../types/certificate';

/**
 * One certificate per chant level. A level's certificate unlocks when the level
 * is COMPLETED; each card says exactly where the devotee stands with it:
 * ready to download, completed but not published yet, or how far to go.
 */
export function CertificatesScreen() {
  const data = useCertificateStore(s => s.data);
  const loading = useCertificateStore(s => s.loading);
  const error = useCertificateStore(s => s.error);
  const [open, setOpen] = useState<CertificateLevel | null>(null);

  const load = useCallback(() => {
    void useCertificateStore.getState().load();
  }, []);
  useFocusEffect(load);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerClassName="p-4 pb-10 gap-3 w-full max-w-[600px] self-center"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error ? <Banner type="error" message={error} /> : null}

        <View className="overflow-hidden rounded-3xl bg-primary p-5">
          <Text className="text-xs font-medium uppercase tracking-widest text-white/80">
            Your certificates
          </Text>
          <Text className="mt-1 text-xl font-extrabold text-white">
            Complete a level to earn its certificate
          </Text>
          <Text className="mt-1 text-sm text-white/90">
            {data ? `You have chanted ${formatNumber(data.count)} times.` : 'Loading…'}
          </Text>
        </View>

        {data && !data.enabled && (
          <View className="flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
            <Clock size={20} color={colors.textSecondary} />
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Certificate downloads aren’t open yet. Keep chanting — your completed levels will be
              ready to download as soon as they are.
            </Text>
          </View>
        )}

        {data?.levels.map(level => {
          const size = Math.max(1, level.to - level.from);
          const inLevel = Math.max(0, Math.min(size, data.count - level.from));
          const ready = data.enabled && level.certificate !== null;
          return (
            <View
              key={level.n}
              className={`rounded-2xl border bg-white p-4 ${
                ready ? 'border-amber-200' : 'border-gray-100'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    level.earned ? 'bg-amber-50' : 'bg-gray-100'
                  }`}
                >
                  {level.earned ? (
                    <Award size={22} color={colors.gold} />
                  ) : (
                    <Lock size={18} color={colors.textMuted} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{level.name}</Text>
                  <Text className="text-xs text-gray-500">
                    Level {level.n} · complete at {formatNumber(level.to)} chants
                  </Text>
                </View>
              </View>

              {ready ? (
                <View className="mt-3">
                  <Button
                    label="View & download"
                    leftIcon={Download}
                    onPress={() => setOpen(level)}
                  />
                </View>
              ) : level.earned ? (
                <Text className="mt-3 text-sm text-gray-600">
                  {data.enabled && !level.hasCertificate
                    ? 'Level completed 🙏 Its certificate is being prepared.'
                    : 'Level completed 🙏'}
                </Text>
              ) : (
                <View className="mt-3">
                  <ProgressBar value={(inLevel / size) * 100} height={8} />
                  <Text className="mt-1.5 text-xs text-gray-500">
                    {data.count < level.from
                      ? `Unlocks after the previous levels`
                      : `${formatNumber(level.to - data.count)} chants to complete`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {open && open.certificate && data && (
        <CertificateViewer
          level={open}
          certificate={open.certificate}
          name={data.fullName}
          onClose={() => setOpen(null)}
        />
      )}
    </View>
  );
}
