import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, PixelRatio, Text, View } from 'react-native';
import type { LevelCertificate } from '../../types/certificate';
import {
  fitFontSize,
  fontFamilyFor,
  outputSize,
  startFontSize,
} from '../../utils/certificate';

export interface CertificateRendererHandle {
  /** Capture the certificate at full resolution; resolves to a temp PNG file. */
  capture: () => Promise<string>;
}

/**
 * Draws a devotee's name onto a certificate template and can capture it as an
 * image.
 *
 * How it stays sharp: the certificate is laid out at its OUTPUT size (image
 * pixels ÷ pixel ratio, so it renders at full resolution), and only its parent
 * is scaled down to fit the on-screen preview. The capture targets the
 * unscaled view, so the saved PNG is full size while the preview fits the
 * screen.
 *
 * How the name fits: it is measured once, invisibly, at the starting size, and
 * the final size is derived from that — the same rule as the admin preview.
 */
export const CertificateRenderer = forwardRef<
  CertificateRendererHandle,
  {
    cert: LevelCertificate;
    name: string;
    /** On-screen width of the preview, in dp. */
    previewWidth: number;
    /** Fires once the image has loaded and the name has been sized. */
    onReady?: () => void;
    onError?: () => void;
  }
>(function CertificateRenderer({ cert, name, previewWidth, onReady, onError }, ref) {
  const shotRef = useRef<View>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [measured, setMeasured] = useState<{ key: string; width: number } | null>(null);

  const out = outputSize(cert);
  const ratio = PixelRatio.get();
  const layoutW = out.width / ratio;
  const layoutH = out.height / ratio;
  const scale = previewWidth / layoutW;
  const previewHeight = layoutH * scale;

  const bx = cert.box.x * layoutW;
  const by = cert.box.y * layoutH;
  const bw = cert.box.w * layoutW;
  const bh = cert.box.h * layoutH;
  const start = startFontSize(bh);
  const fontFamily = fontFamilyFor(cert.font);
  const text = name.trim();

  // Re-measure whenever what's being measured changes.
  const measureKey = `${text}|${cert.font}|${start}`;
  const fontSize =
    measured && measured.key === measureKey ? fitFontSize(start, bw, measured.width) : null;

  // An empty name has nothing to size — the image alone is the certificate.
  const ready = imageLoaded && (text.length === 0 || fontSize !== null);
  useEffect(() => {
    if (ready) onReady?.();
    // Only the transition to ready matters, not a new callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      // Let the final frame (image + name) paint before grabbing it.
      await new Promise<void>(r => setTimeout(() => r(), 200));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { captureRef } = require('react-native-view-shot');
      return captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
    },
  }));

  const nameStyle = {
    color: cert.color,
    fontFamily,
    fontWeight: '600' as const,
    includeFontPadding: false,
  };

  return (
    <View
      style={{ width: previewWidth, height: previewHeight, overflow: 'hidden', borderRadius: 12 }}
    >
      <View
        style={{
          width: layoutW,
          height: layoutH,
          // Centre the full-size layout on the preview, then shrink it about
          // its centre. Transforms apply only to how it's shown, not captured.
          transform: [
            { translateX: (previewWidth - layoutW) / 2 },
            { translateY: (previewHeight - layoutH) / 2 },
            { scale },
          ],
        }}
      >
        <View
          ref={shotRef}
          collapsable={false}
          style={{ width: layoutW, height: layoutH, backgroundColor: '#FFFFFF' }}
        >
          <Image
            source={{ uri: cert.imageUrl }}
            style={{ width: layoutW, height: layoutH }}
            resizeMode="stretch"
            onLoad={() => setImageLoaded(true)}
            onError={() => onError?.()}
          />
          {fontSize !== null && text.length > 0 && (
            <View
              style={{
                position: 'absolute',
                left: bx,
                top: by,
                width: bw,
                height: bh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text numberOfLines={1} style={[nameStyle, { fontSize, textAlign: 'center' }]}>
                {text}
              </Text>
            </View>
          )}
        </View>

        {/* Invisible measuring pass — outside the captured view. */}
        {text.length > 0 && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, top: 0, width: 20000, opacity: 0, alignItems: 'flex-start' }}
          >
            <Text
              key={measureKey}
              numberOfLines={1}
              style={[nameStyle, { fontSize: start }]}
              onLayout={e => setMeasured({ key: measureKey, width: e.nativeEvent.layout.width })}
            >
              {text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});
