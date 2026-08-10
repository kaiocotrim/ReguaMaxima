import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, router } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BarbershopDetails } from "../../services/barbershops";

export function BarbersSheet({
  visible,
  barbers,
  onClose,
}: {
  visible: boolean;
  barbers: BarbershopDetails["barbers"];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <Pressable accessibilityLabel="Fechar barbeiros" onPress={onClose} className="absolute inset-0" />
        <View
          className="max-h-[75%] rounded-t-[26px] bg-[#FAFAFA] px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mb-4 h-1 w-12 self-center rounded-full bg-[#DCE0DE]" />
          <Text className="mb-5 text-center text-[21px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Nossos barbeiros</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {barbers.map((barber) => (
              <Pressable
                key={barber.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir perfil de ${barber.name}`}
                onPress={() => {
                  onClose();
                  router.push(`/barbers/${barber.id}` as Href);
                }}
                className="mb-3 min-h-[76px] flex-row items-center rounded-[17px] border border-[#E0E4E1] bg-white px-4 py-3 active:opacity-75"
              >
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#EDF1EF]">
                  {barber.avatar ? <Image source={{ uri: barber.avatar }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person-outline" size={23} color="#82908C" />}
                </View>
                <View className="ml-3 min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{barber.name}</Text>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="star" size={15} color="#FFB000" />
                    <Text className="ml-1 text-[12px] text-[#65706D]" style={{ fontFamily: "Satoshi-Medium" }}>
                      {barber.averageRating?.toFixed(1) ?? "Novo"}
                      {barber.reviewCount > 0 ? ` · ${barber.reviewCount} ${barber.reviewCount === 1 ? "avaliação" : "avaliações"}` : ""}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8A9390" />
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} className="mt-2 h-12 items-center justify-center rounded-[13px] bg-[#B8F51C] active:opacity-75">
            <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
