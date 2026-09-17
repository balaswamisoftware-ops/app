import { PermissionsAndroid, Platform } from 'react-native';
import { getSupabaseClient } from './supabaseClient';
import type { CertificateLevel, MyCertificates } from '../types/certificate';
import { parseCertificate } from '../utils/certificate';

type Row = Record<string, unknown>;

const NONE: MyCertificates = { enabled: false, count: 0, fullName: '', levels: [] };

/** The signed-in devotee's certificates: which levels are earned and downloadable. */
export async function fetchMyCertificates(): Promise<MyCertificates> {
  const supabase = getSupabaseClient();
  if (!supabase) return NONE;
  const { data, error } = await supabase.rpc('my_certificates');
  if (error) {
    // A server without certificates-app.sql simply has no certificates yet.
    if (/my_certificates/.test(error.message)) return NONE;
    throw new Error(error.message);
  }
  const d = (data ?? {}) as Row;
  const levels: CertificateLevel[] = ((d.levels as Row[]) ?? []).map((l, i) => ({
    n: Number(l.n ?? i + 1),
    name: String(l.name ?? `Level ${i + 1}`),
    from: Number(l.from ?? 0),
    to: Number(l.to ?? 0),
    earned: l.earned === true,
    hasCertificate: l.hasCertificate === true,
    certificate: parseCertificate(l.certificate),
  }));
  return {
    enabled: d.enabled === true,
    count: Number(d.count ?? 0),
    fullName: String(d.fullName ?? ''),
    levels,
  };
}

/**
 * Save a rendered certificate image to the phone's gallery, in a
 * "Sri Vidya Peetam" album.
 *
 * Android 10+ saves through MediaStore and needs no permission. Android 7–9
 * writes to shared storage and needs WRITE_EXTERNAL_STORAGE, declared with
 * maxSdkVersion 28 so newer devices never see the request. The native modules
 * are required lazily so a build without them fails with a clear message
 * rather than crashing at import.
 */
export async function saveCertificateToGallery(fileUri: string): Promise<void> {
  if (Platform.OS === 'android' && Number(Platform.Version) < 29) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Save your certificate',
        message: 'Allow Sri Vidya Peetam to save the certificate to your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Allow storage access to save the certificate to your gallery.');
    }
  }
  let CameraRoll: { saveAsset: (uri: string, o: object) => Promise<unknown> };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    CameraRoll = require('@react-native-camera-roll/camera-roll').CameraRoll;
  } catch {
    throw new Error('Please update the app to download certificates.');
  }
  const uri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
  await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Sri Vidya Peetam' });
}
