import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Download, X } from 'lucide-react-native';

import { Button } from '../ui';
import { colors } from '../../constants/theme';
import type { CertificateLevel, LevelCertificate } from '../../types/certificate';
import { saveCertificateToGallery } from '../../services/certificateService';
import { CertificateRenderer, type CertificateRendererHandle } from './CertificateRenderer';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Full-screen preview of one certificate with the devotee's name on it, and a
 * button that saves it to the phone's gallery at full resolution.
 */
export function CertificateViewer({
  level,
  certificate,
  name,
  onClose,
}: {
  level: CertificateLevel;
  certificate: LevelCertificate;
  name: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const previewWidth = Math.min(width - 32, 560);

  const rendererRef = useRef<CertificateRendererHandle>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [save, setSave] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const download = async () => {
    if (!rendererRef.current || save === 'saving') return;
    setSave('saving');
    setMessage(null);
    try {
      const file = await rendererRef.current.capture();
      await saveCertificateToGallery(file);
      setSave('saved');
      setMessage('Saved to your gallery, in the “Sri Vidya Peetam” album.');
    } catch (e) {
      setSave('error');
      setMessage(e instanceof Error ? e.message : 'Could not save the certificate.');
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">{level.name} certificate</Text>
            <Text className="text-xs text-gray-500">Level {level.n}</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="items-center p-4 gap-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {loadFailed ? (
            <View className="w-full flex-row items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} color={colors.danger} />
              <Text className="flex-1 text-sm text-red-700">
                The certificate couldn’t be loaded. Check your connection and open it again.
              </Text>
            </View>
          ) : (
            <View className="rounded-2xl bg-white p-1" style={{ elevation: 2 }}>
              <CertificateRenderer
                ref={rendererRef}
                cert={certificate}
                name={name}
                previewWidth={previewWidth - 8}
                onReady={() => setReady(true)}
                onError={() => setLoadFailed(true)}
              />
              {!ready && (
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-sm text-gray-400">Preparing your certificate…</Text>
                </View>
              )}
            </View>
          )}

          {message ? (
            <View
              className={`w-full flex-row items-start gap-2 rounded-2xl p-3.5 ${
                save === 'saved' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {save === 'saved' ? (
                <CheckCircle2 size={18} color={colors.success} />
              ) : (
                <AlertCircle size={18} color={colors.danger} />
              )}
              <Text
                className={`flex-1 text-sm ${save === 'saved' ? 'text-green-800' : 'text-red-700'}`}
              >
                {message}
              </Text>
            </View>
          ) : null}

          <View className="w-full max-w-[560px]">
            <Button
              label={save === 'saved' ? 'Download again' : 'Download certificate'}
              leftIcon={Download}
              size="lg"
              disabled={!ready || loadFailed}
              isLoading={save === 'saving'}
              onPress={download}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
