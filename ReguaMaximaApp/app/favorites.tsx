import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AuthUser, getStoredUser } from "../services/auth";
import type { Barbershop } from "../services/barbershops";
import {
  type FavoriteBarber,
  listFavorites,
  toggleFavoriteBarbershop,
} from "../services/favorites";
import { SideMenu } from "./_components/SideMenu";

const BRAND = "#254F50";
const LIME = "#B8F51C";

function BarbershopCard({
  item,
  removing,
  onRemove,
}: {
  item: Barbershop;
  removing: boolean;
  onRemove: () => void;
}) {
  const rating = item.averageRating?.toFixed(1) ?? "Novo";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${item.name}`}
      onPress={() => router.push(`/barbershops/${item.id}` as Href)}
      className="mb-4 overflow-hidden rounded-[20px] border border-[#DFE3E0] bg-white active:opacity-80"
      style={{ elevation: 2, shadowColor: BRAND, shadowOpacity: 0.06, shadowRadius: 12 }}
    >
      <View className="h-[170px] bg-[#E8ECE9]">
        <Image
          source={{ uri: item.capaUrl || item.imageUrl }}
          contentFit="cover"
          transition={160}
          style={{ width: "100%", height: "100%" }}
        />
        <View className="absolute left-3 top-3 flex-row items-center rounded-full bg-[#B8F51C] px-2.5 py-1.5">
          <Ionicons name="star" size={12} color={BRAND} />
          <Text className="ml-1 text-[12px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{rating}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.name} dos favoritos`}
          disabled={removing}
          onPress={(event) => { event.stopPropagation(); onRemove(); }}
          className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full bg-white/95 active:opacity-70"
        >
          {removing ? <ActivityIndicator size="small" color={BRAND} /> : <Ionicons name="heart" size={22} color="#8FD000" />}
        </Pressable>
      </View>
      <View className="flex-row items-center p-4">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>{item.name}</Text>
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="location-outline" size={15} color="#64716E" />
            <Text numberOfLines={1} className="ml-1 flex-1 text-[13px] text-[#64716E]" style={{ fontFamily: "Satoshi-Medium" }}>{item.address}</Text>
          </View>
        </View>
        <View className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-[#F0F6E5]">
          <Ionicons name="chevron-forward" size={19} color={BRAND} />
        </View>
      </View>
    </Pressable>
  );
}

function BarberCard({ item }: { item: FavoriteBarber }) {
  return (
    <Pressable
      disabled={!item.barbershop}
      onPress={() => item.barbershop && router.push(`/barbershops/${item.barbershop.id}` as Href)}
      className="mr-3 w-[210px] flex-row items-center rounded-[18px] border border-[#DFE3E0] bg-white p-3 active:opacity-75"
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#EDF1EF]">
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
        ) : (
          <Ionicons name="cut-outline" size={23} color="#82908C" />
        )}
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{item.nome || "Profissional"}</Text>
        <Text numberOfLines={1} className="mt-1 text-[12px] text-[#6C7774]" style={{ fontFamily: "Satoshi-Regular" }}>{item.barbershop?.name || item.jobTitle}</Text>
      </View>
    </Pressable>
  );
}

export default function FavoritesPage() {
  const insets = useSafeAreaInsets();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [barbers, setBarbers] = useState<FavoriteBarber[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await listFavorites();
      setBarbershops(data.barbershops);
      setBarbers(data.barbers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar seus favoritos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void getStoredUser().then(setUser);
    void load();
  }, [load]);

  function confirmRemove(item: Barbershop) {
    Alert.alert("Remover dos favoritos?", `${item.name} deixará de aparecer nesta lista.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          setRemovingId(item.id);
          void toggleFavoriteBarbershop(item.id)
            .then((favorited) => {
              if (!favorited) setBarbershops((current) => current.filter(({ id }) => id !== item.id));
            })
            .catch((removeError: unknown) => Alert.alert("Não foi possível remover", removeError instanceof Error ? removeError.message : "Tente novamente."))
            .finally(() => setRemovingId(null));
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-[#F6F7F5]">
      <StatusBar style="dark" />
      <SideMenu visible={menuVisible} user={user} onClose={() => setMenuVisible(false)} />
      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E9E7] bg-white">
        <View className="h-16 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]">
            <Ionicons name="chevron-back" size={24} color={BRAND} />
          </Pressable>
          <Text className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>Favoritos</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={() => setMenuVisible(true)} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]">
            <Ionicons name="menu-outline" size={25} color={BRAND} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={BRAND} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        <View className="mx-4 mt-4 overflow-hidden rounded-[22px] bg-[#254F50] px-5 py-6">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#B8F51C]"><Ionicons name="heart" size={22} color={BRAND} /></View>
          <Text className="mt-4 text-[26px] leading-8 text-white" style={{ fontFamily: "Satoshi-Black", letterSpacing: -0.5 }}>Barbearias que você curte</Text>
          <Text className="mt-1.5 text-[14px] text-[#D7E2DE]" style={{ fontFamily: "Satoshi-Regular" }}>Seus estabelecimentos salvos em um só lugar.</Text>
          <View className="mt-5 border-t border-white/15 pt-4">
            <Text className="text-[13px] text-white" style={{ fontFamily: "Satoshi-Medium" }}><Text style={{ fontFamily: "Satoshi-Bold", color: LIME }}>{barbershops.length}</Text> {barbershops.length === 1 ? "barbearia salva" : "barbearias salvas"}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND} className="mt-16" />
        ) : error ? (
          <Pressable onPress={() => void load()} className="mx-4 mt-6 items-center rounded-[20px] border border-[#DFE3E0] bg-white px-6 py-10">
            <Ionicons name="cloud-offline-outline" size={35} color="#82908C" />
            <Text className="mt-3 text-center text-[14px] text-[#65706D]" style={{ fontFamily: "Satoshi-Medium" }}>{error}</Text>
            <Text className="mt-3 text-[14px] text-[#7DBB00]" style={{ fontFamily: "Satoshi-Bold" }}>Tentar novamente</Text>
          </Pressable>
        ) : (
          <>
            <View className="px-4 pt-7">
              {barbershops.length === 0 ? (
                <View className="items-center rounded-[20px] border border-dashed border-[#CBD2CE] bg-white px-6 py-10">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F0F6E5]"><Ionicons name="heart-outline" size={27} color="#8BCB00" /></View>
                  <Text className="mt-4 text-[17px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Nenhuma favorita ainda</Text>
                  <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>Explore as barbearias e toque no coração para salvar suas favoritas.</Text>
                  <Pressable onPress={() => router.replace("/home")} className="mt-5 h-11 items-center justify-center rounded-[12px] bg-[#B8F51C] px-6 active:opacity-70"><Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Explorar barbearias</Text></Pressable>
                </View>
              ) : barbershops.map((item) => <BarbershopCard key={item.id} item={item} removing={removingId === item.id} onRemove={() => confirmRemove(item)} />)}
            </View>

            <View className="mt-5">
              <View className="mb-4 px-4">
                <Text className="text-[11px] uppercase text-[#7AAE10]" style={{ fontFamily: "Satoshi-Bold", letterSpacing: 1 }}>Profissionais</Text>
                <Text className="mt-1 text-[19px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Seus profissionais favoritos</Text>
              </View>
              {barbers.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {barbers.map((item) => <BarberCard key={item.id} item={item} />)}
                </ScrollView>
              ) : (
                <Text className="mx-4 rounded-[18px] border border-dashed border-[#CBD2CE] bg-white p-6 text-center text-[13px] text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>Você ainda não salvou nenhum profissional.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
