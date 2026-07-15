import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';

import { LEGAL_DOCUMENTS, type LegalDocumentId } from '../constants/legal';

type LegalRoute = RouteProp<Record<string, { document: LegalDocumentId }>, string>;

/**
 * Renders a legal document (Terms & Conditions or Privacy Policy) as a clean,
 * scrollable page with headings, paragraphs and bullet lists. Used from both
 * the Sign-Up flow and the Profile screen via the `document` route param.
 */
export function LegalScreen({ route }: { route: LegalRoute }) {
  const doc = LEGAL_DOCUMENTS[route.params.document];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-5 pb-12 w-full max-w-[640px] self-center"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-extrabold text-gray-900">{doc.title}</Text>
      <Text className="mt-1 text-xs text-gray-400">Last updated: {doc.updated}</Text>

      <Text className="mt-4 text-[15px] leading-6 text-gray-600">{doc.intro}</Text>

      {doc.blocks.map(block => (
        <View key={block.heading} className="mt-6">
          <Text className="text-base font-bold text-gray-900">{block.heading}</Text>

          {block.paragraphs?.map((p, i) => (
            <Text
              key={i}
              className="mt-2 text-[15px] leading-6 text-gray-600"
            >
              {p}
            </Text>
          ))}

          {block.bullets ? (
            <View className="mt-2 gap-2">
              {block.bullets.map((b, i) => (
                <View key={i} className="flex-row gap-2.5">
                  <Text className="text-[15px] leading-6 text-primary">•</Text>
                  <Text className="flex-1 text-[15px] leading-6 text-gray-600">
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <Text className="mt-10 text-center text-xs text-gray-300">
        Sri Vidya Peetham 🙏
      </Text>
    </ScrollView>
  );
}
