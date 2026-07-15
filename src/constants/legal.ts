/**
 * Terms & Conditions and Privacy Policy content for Sri Vidya Peetham.
 *
 * This is professionally structured, plain-language content tailored to the
 * app. Review it with a legal advisor before publishing, and update
 * `updated`, `contactEmail`, and any entity details as needed.
 */

export type LegalDocumentId = 'terms' | 'privacy';

/** A titled block of content — paragraphs and/or bullet points. */
export interface LegalBlock {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  updated: string;
  intro: string;
  blocks: LegalBlock[];
}

const CONTACT_EMAIL = 'support@srividyapitam.app';
const UPDATED = '15 July 2026';

const TERMS: LegalDocument = {
  id: 'terms',
  title: 'Terms & Conditions',
  updated: UPDATED,
  intro:
    'Welcome to Sri Vidya Peetham. These Terms & Conditions ("Terms") govern your use of the Sri Vidya Peetham mobile application (the "App"). By creating an account or using the App, you agree to be bound by these Terms. Please read them carefully.',
  blocks: [
    {
      heading: '1. Acceptance of Terms',
      paragraphs: [
        'By registering for, accessing, or using the App, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy. If you do not agree, please do not use the App.',
      ],
    },
    {
      heading: '2. Eligibility',
      paragraphs: [
        'You must be at least 13 years of age to use the App. By using the App, you represent that you meet this requirement and that the information you provide is accurate and complete.',
      ],
    },
    {
      heading: '3. Your Account',
      bullets: [
        'You register using your mobile number and a password. You are responsible for keeping your login details confidential.',
        'You are responsible for all activity that occurs under your account.',
        'Please notify us immediately if you suspect any unauthorised use of your account.',
        'One account is intended per devotee. Details such as your Nakshatram and Gothram are stored to personalise your seva.',
      ],
    },
    {
      heading: '4. The Chanting Mission',
      paragraphs: [
        'The App lets you count your "Om Namah Shivaya" chants towards your personal seva goal and a shared community goal. Chant counts you record are stored to your account and contribute to the community total.',
        'Chant counts are recorded in good faith for your spiritual practice. Administrators may adjust counts to correct errors; any such change is shown in your chanting history.',
      ],
    },
    {
      heading: '5. Seva Donations',
      bullets: [
        'The App allows you to make a voluntary seva donation (e.g. ₹216) via UPI / PhonePe and upload a payment screenshot for verification.',
        'Donations are processed outside the App through your chosen payment method. We do not store your full payment card or bank details.',
        'Once a donation is verified, it is treated as a voluntary offering and is generally non-refundable, except where required by law.',
        'Verification is performed manually by our administrators and may take some time. Submitting a screenshot does not guarantee immediate confirmation.',
      ],
    },
    {
      heading: '6. Advertisements',
      paragraphs: [
        'The App may display advertisements provided by third-party ad networks such as Google AdMob. These ads help keep the App free. We are not responsible for the content of third-party advertisements or the websites they link to.',
      ],
    },
    {
      heading: '7. Acceptable Use',
      bullets: [
        'Use the App only for lawful, personal, devotional purposes.',
        'Do not attempt to disrupt, hack, reverse-engineer, or overload the App or its servers.',
        'Do not submit false payment information or attempt to manipulate chant counts or donations.',
        'Do not use the App to harass others or upload unlawful or offensive content.',
      ],
    },
    {
      heading: '8. Intellectual Property',
      paragraphs: [
        'The App, its name, logo, design, and content are owned by Sri Vidya Peetham or its licensors and are protected by applicable laws. You may not copy, modify, distribute, or create derivative works without our prior written permission.',
      ],
    },
    {
      heading: '9. Disclaimers',
      paragraphs: [
        'The App is provided on an "as is" and "as available" basis for devotional and informational purposes. While we strive for accuracy and reliability, we do not warrant that the App will be uninterrupted, error-free, or free of inaccuracies.',
      ],
    },
    {
      heading: '10. Limitation of Liability',
      paragraphs: [
        'To the maximum extent permitted by law, Sri Vidya Peetham shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, the App, including any loss of data or chant counts.',
      ],
    },
    {
      heading: '11. Termination',
      paragraphs: [
        'We may suspend or terminate your access to the App if you breach these Terms or misuse the App. You may stop using the App and request deletion of your account at any time by contacting us.',
      ],
    },
    {
      heading: '12. Changes to These Terms',
      paragraphs: [
        'We may update these Terms from time to time. When we do, we will update the "Last updated" date. Your continued use of the App after changes take effect constitutes acceptance of the revised Terms.',
      ],
    },
    {
      heading: '13. Governing Law',
      paragraphs: [
        'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.',
      ],
    },
    {
      heading: '14. Contact Us',
      paragraphs: [
        `If you have any questions about these Terms, please contact us at ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};

const PRIVACY: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  updated: UPDATED,
  intro:
    'This Privacy Policy explains how Sri Vidya Peetham ("we", "us") collects, uses, and protects your information when you use the Sri Vidya Peetham mobile application (the "App"). We are committed to protecting your privacy and handling your data responsibly.',
  blocks: [
    {
      heading: '1. Information We Collect',
      bullets: [
        'Account details: your full name, mobile number, Nakshatram, Gothram, and password (stored securely).',
        'Devotional activity: your chant counts and chanting history.',
        'Donation details: the donation amount, UPI transaction ID, and the payment screenshot you upload for verification.',
        'Technical & advertising data: device information and advertising identifiers used by ad and analytics providers to serve and measure ads.',
      ],
    },
    {
      heading: '2. How We Use Your Information',
      bullets: [
        'To create and manage your devotee account and authenticate you.',
        'To record your chant counts and show your progress and history.',
        'To verify and record your seva donations.',
        'To display advertisements that keep the App free.',
        'To maintain the security, integrity, and proper functioning of the App.',
      ],
    },
    {
      heading: '3. Advertising & Analytics',
      paragraphs: [
        'The App uses Google AdMob to display advertisements. AdMob and its partners may use device identifiers and similar technologies to serve personalised or non-personalised ads and to measure ad performance.',
        'You can manage ad personalisation through your device settings (for example, "Reset advertising ID" or "Opt out of Ads Personalisation" on Android).',
      ],
    },
    {
      heading: '4. How We Share Information',
      bullets: [
        'We do not sell your personal information.',
        'Service providers: we use trusted providers such as Supabase (secure database, authentication, and file storage) and Google AdMob (advertising) to operate the App. They process data only to provide these services.',
        'Legal reasons: we may disclose information if required by law or to protect the rights, safety, and security of our users and the App.',
      ],
    },
    {
      heading: '5. Data Storage & Security',
      paragraphs: [
        'Your data is stored on secure cloud infrastructure with access controls and row-level security so that you can only access your own records. Payment screenshots are stored in a private, access-controlled bucket. While we take reasonable measures to protect your data, no method of transmission or storage is completely secure.',
      ],
    },
    {
      heading: '6. Data Retention',
      paragraphs: [
        'We retain your account and activity data for as long as your account is active or as needed to provide the App and meet legal obligations. You may request deletion of your account and associated data at any time.',
      ],
    },
    {
      heading: '7. Your Rights & Choices',
      bullets: [
        'Access and update: you can view and edit your profile details within the App.',
        'Deletion: you can request deletion of your account and personal data by contacting us.',
        'Ad choices: you can limit ad personalisation through your device settings.',
      ],
    },
    {
      heading: '8. Children’s Privacy',
      paragraphs: [
        'The App is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us so we can remove it.',
      ],
    },
    {
      heading: '9. Third-Party Links',
      paragraphs: [
        'The App may contain links or advertisements that lead to third-party websites or services. We are not responsible for the privacy practices of those third parties. Please review their policies before providing any information.',
      ],
    },
    {
      heading: '10. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date. We encourage you to review this policy periodically.',
      ],
    },
    {
      heading: '11. Contact Us',
      paragraphs: [
        `If you have any questions or requests regarding this Privacy Policy or your data, please contact us at ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  terms: TERMS,
  privacy: PRIVACY,
};
