/**
 * Chant-level certificates, devotee side. Mirrors `my_certificates()` in
 * certificates-app.sql and the template the admin designs in the portal.
 */

/** Where the name goes, as fractions (0..1) of the image's width/height. */
export interface CertificateBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CertificateFont = 'serif' | 'sans';

/** A level's certificate template. */
export interface LevelCertificate {
  imageUrl: string;
  /** Natural image size in pixels. */
  width: number;
  height: number;
  box: CertificateBox;
  /** Name colour, `#rrggbb`. */
  color: string;
  font: CertificateFont;
}

/** One level as it concerns the signed-in devotee. */
export interface CertificateLevel {
  n: number;
  name: string;
  from: number;
  to: number;
  /** Completed — count has reached this level's end. */
  earned: boolean;
  /** The admin has published a usable certificate for this level. */
  hasCertificate: boolean;
  /** Only present when earned AND downloads are on. */
  certificate: LevelCertificate | null;
}

export interface MyCertificates {
  /** The admin's "allow downloads" switch. */
  enabled: boolean;
  count: number;
  /** The name printed on every certificate. */
  fullName: string;
  levels: CertificateLevel[];
}
