import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AuthUser, getStoredUser } from "../../services/auth";
import { type PublicBarber, getPublicBarber } from "../../services/public-barbers";
import { SideMenu } from "../_components/SideMenu";

const BRAND = "#254F50";

export default function BarberProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [barber, setBarber] = useState<PublicBarber | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      setBarber(await getPublicBarber(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void getStoredUser().then(setUser);
    void load();
  }, [load]);

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F6F7F5]"><StatusBar style="dark" /><ActivityIndicator size="large" color={BRAND} /></View>;
  if (!barber || error) return (
    <View className="flex-1 items-center justify-center bg-[#F6F7F5] px-7">
      <StatusBar style="dark" />
      <Ionicons name="person-circle-outline" size={48} color="#8A9490" />
      <Text className="mt-4 text-center text-[14px] text-[#65706D]" style={{ fontFamily: "Satoshi-Medium" }}>{error || "Barbeiro não encontrado."}</Text>
      <Pressable onPress={() => { setLoading(true); void load(); }} className="mt-5 rounded-[12px] bg-[#B8F51C] px-6 py-3"><Text className="text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Tentar novamente</Text></Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F6F7F5]">
      <StatusBar style="dark" />
      <SideMenu visible={menuVisible} user={user} onClose={() => setMenuVisible(false)} />
      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E9E7] bg-white">
        <View className="h-16 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : barber.barbershop ? router.replace(`/barbershops/${barber.barbershop.id}` as Href) : router.replace("/home")} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="chevron-back" size={24} color={BRAND} /></Pressable>
          <Text className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>Perfil do barbeiro</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={() => setMenuVisible(true)} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="menu-outline" size={25} color={BRAND} /></Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={BRAND} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View className="items-center bg-white px-5 pb-6 pt-7">
          <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#B8F51C] bg-[#EDF1EF]">
            {barber.avatar ? <Image source={{ uri: barber.avatar }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person" size={42} color="#84908C" />}
          </View>
          <Text className="mt-4 text-[25px] text-[#254F50]" style={{ fontFamily: "Satoshi-Black", letterSpacing: -0.4 }}>{barber.name}</Text>
          <Text className="mt-1 text-[13px] text-[#68736F]" style={{ fontFamily: "Satoshi-Medium" }}>{barber.jobTitle}</Text>
          {barber.barbershop && <View className="mt-2 flex-row items-center"><Ionicons name="storefront-outline" size={15} color={BRAND} /><Text className="ml-1.5 text-[13px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{barber.barbershop.name}</Text></View>}
          {barber.city && <View className="mt-1.5 flex-row items-center"><Ionicons name="location-outline" size={15} color="#68736F" /><Text className="ml-1 text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Regular" }}>{barber.city}</Text></View>}
          <View className="mt-4 flex-row items-center rounded-[14px] bg-[#F3F6F3] px-5 py-3">
            <Ionicons name="star" size={22} color="#FFB000" />
            <View className="ml-2"><Text className="text-[18px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{barber.averageRating?.toFixed(1) ?? "Novo"}</Text><Text className="text-[10px] text-[#68736F]" style={{ fontFamily: "Satoshi-Regular" }}>{barber.reviewCount} {barber.reviewCount === 1 ? "avaliação" : "avaliações"}</Text></View>
          </View>
          {barber.barbershop && <Pressable onPress={() => router.push(`/barbershops/${barber.barbershop!.id}` as Href)} className="mt-5 h-12 w-full flex-row items-center justify-center rounded-[13px] bg-[#B8F51C] active:opacity-75"><Ionicons name="calendar-outline" size={19} color={BRAND} /><Text className="ml-2 text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Agendar com {barber.name}</Text></Pressable>}
        </View>

        <View className="px-4">
          {barber.bio && <View className="mt-5 rounded-[18px] border border-[#DFE3E0] bg-white p-4"><Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Sobre meu trabalho</Text><Text className="mt-2 text-[13px] leading-5 text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>{barber.bio}</Text></View>}
          {barber.specialties.length > 0 && <View className="mt-6"><Text className="mb-3 text-[16px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Especialidades</Text><View className="flex-row flex-wrap gap-2">{barber.specialties.map((specialty) => <View key={specialty} className="flex-row items-center rounded-full bg-[#EAF5D4] px-3 py-2"><Ionicons name="cut-outline" size={14} color={BRAND} /><Text className="ml-1.5 text-[12px] text-[#254F50]" style={{ fontFamily: "Satoshi-Medium" }}>{specialty}</Text></View>)}</View></View>}

          <View className="mt-7"><Text className="mb-3 text-[16px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Meus trabalhos</Text>{barber.portfolio.length ? <View className="flex-row flex-wrap justify-between">{barber.portfolio.map((photo) => <View key={photo.id} className="mb-3 h-[170px] w-[48.5%] overflow-hidden rounded-[16px] bg-[#E8ECE9]"><Image source={{ uri: photo.imageUrl }} contentFit="cover" style={{ width: "100%", height: "100%" }} /></View>)}</View> : <View className="items-center rounded-[18px] border border-dashed border-[#CBD2CE] bg-white px-5 py-9"><Ionicons name="images-outline" size={30} color="#8A9490" /><Text className="mt-2 text-center text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Regular" }}>Este profissional ainda não adicionou fotos ao portfólio.</Text></View>}</View>

          <View className="mt-7"><Text className="mb-3 text-[16px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Avaliações dos clientes</Text>{barber.reviews.length ? barber.reviews.map((review) => <View key={review.id} className="mb-3 rounded-[18px] border border-[#DFE3E0] bg-white p-4"><View className="flex-row justify-between"><Text className="text-[13px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{review.userName}</Text><Text className="text-[11px] text-[#89928F]" style={{ fontFamily: "Satoshi-Regular" }}>{new Date(review.createdAt).toLocaleDateString("pt-BR")}</Text></View><View className="mt-2 flex-row">{[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={star <= review.rating ? "star" : "star-outline"} size={15} color="#FFB000" />)}</View>{review.comment && <Text className="mt-3 text-[13px] leading-5 text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>{review.comment}</Text>}</View>) : <View className="items-center rounded-[18px] border border-dashed border-[#CBD2CE] bg-white px-5 py-9"><Ionicons name="chatbubble-outline" size={29} color="#8A9490" /><Text className="mt-2 text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Regular" }}>Este barbeiro ainda não recebeu avaliações.</Text></View>}</View>
        </View>
      </ScrollView>
    </View>
  );
}
