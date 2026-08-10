import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { clearSession } from "../services/auth";
import {
  type Barbershop,
  listBarbershops,
} from "../services/barbershops";

const BRAND = "#254F50";
const LIME = "#B8F51C";
const SITE = "https://reguamaxima.cotrimdev.com.br";

const categories = [
  { label: "Cabelo", icon: "content-cut", service: "Cabelo" },
  { label: "Barba", icon: "mustache", service: "Barba" },
  { label: "Acabamento", icon: "briefcase", service: "Acabamento" },
  { label: "Barbearias perto", icon: "store", service: "" },
] as const;

function BarberCard({ item }: { item: Barbershop }) {
  const rating = item.averageRating?.toFixed(1) ?? "Novo";

  return (
    <View className="mb-4 w-[48.5%] overflow-hidden rounded-[18px] border border-[#D9DDDA] bg-white p-2">
      <View className="relative h-[136px] overflow-hidden rounded-[14px] bg-[#E8ECE9]">
        <Image
          source={{ uri: item.imageUrl }}
          contentFit="cover"
          transition={180}
          className="h-full w-full"
        />
        <View className="absolute left-2 top-2 flex-row items-center rounded-full bg-[#B8F51C] px-2 py-1">
          <Ionicons name="star" size={12} color={BRAND} />
          <Text className="ml-1 text-[12px] font-extrabold text-[#254F50]">
            {rating}
          </Text>
        </View>
      </View>

      <View className="px-1 pb-1 pt-3">
        <Text numberOfLines={1} className="text-[14px] font-extrabold text-[#173F40]">
          {item.name}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[13px] text-[#727A78]">
          {item.address}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-3 h-[31px] flex-row items-center justify-center rounded-[9px] bg-[#B8F51C] active:opacity-70"
        >
          <Text className="text-[13px] font-extrabold text-[#254F50]">Agendar</Text>
          <Ionicons name="chevron-forward" size={17} color={BRAND} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBarbershops = useCallback(async (query = search, service = selectedService) => {
    try {
      setError("");
      setBarbershops(await listBarbershops(query, service));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as barbearias.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedService]);

  useEffect(() => {
    async function loadInitialBarbershops() {
      try {
        setBarbershops(await listBarbershops());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar as barbearias.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInitialBarbershops();
  }, []);

  async function handleLogout() {
    await clearSession();
    router.replace("/");
  }

  function openMenu() {
    Alert.alert("Menu", "O que você deseja fazer?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair da conta", style: "destructive", onPress: () => void handleLogout() },
    ]);
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E8E7] bg-[#FAFAFA]">
        <View className="h-[66px] flex-row items-center justify-between px-[20px]">
          <Image
            source={{ uri: `${SITE}/LogoMComBorder3.png` }}
            contentFit="contain"
            className="h-[31px] w-[54px]"
          />
          <Pressable onPress={openMenu} className="h-11 w-11 items-center justify-center active:opacity-60">
            <Ionicons name="menu-outline" size={24} color={BRAND} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={BRAND} onRefresh={() => { setRefreshing(true); void loadBarbershops(); }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View className="px-4 pt-[18px]">
          <View className="flex-row gap-2">
            <View className="h-[45px] flex-1 justify-center rounded-[12px] border border-[#E3E5E4] bg-white px-3">
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={() => void loadBarbershops()}
                placeholder="Pesquise por barbearias e serviços..."
                placeholderTextColor="#697170"
                returnKeyType="search"
                className="text-[15px] font-semibold text-[#254F50]"
              />
            </View>
            <Pressable onPress={() => void loadBarbershops()} className="h-[43px] w-[43px] items-center justify-center rounded-[11px] bg-[#254F50] active:opacity-80">
              <Ionicons name="search-outline" size={20} color={LIME} />
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingVertical: 24 }}>
          {categories.map((category) => {
            const selected = selectedService === category.service && category.service !== "";
            return (
              <Pressable
                key={category.label}
                onPress={() => { setSelectedService(category.service); void loadBarbershops("", category.service); }}
                className={`h-[34px] flex-row items-center rounded-[11px] px-4 ${selected ? "bg-[#B8F51C]" : "bg-white"}`}
              >
                <MaterialCommunityIcons name={category.icon} size={17} color={BRAND} />
                <Text className="ml-2 text-[14px] font-bold text-[#254F50]">{category.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mx-4 h-[151px] overflow-hidden rounded-[18px] border border-[#E1E5E2] bg-white">
          <Image source={{ uri: `${SITE}/bannerReguaM-light1.png` }} contentFit="cover" transition={180} className="h-full w-full" />
        </View>

        <View className="mb-5 mt-6 flex-row items-center justify-between px-[18px]">
          <Text className="text-[12px] font-extrabold uppercase text-[#163E3F]">Recomendações</Text>
          <View className="flex-row items-center gap-4">
            <Text className="text-[12px] font-bold text-[#727674]">Todas</Text>
            <Text className="text-[12px] font-extrabold text-[#8FCF00]">Mapa</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND} className="mt-10" />
        ) : error ? (
          <Pressable onPress={() => void loadBarbershops()} className="mx-5 items-center rounded-2xl bg-white p-6">
            <Text className="text-center text-[#697170]">{error}</Text>
            <Text className="mt-2 font-bold text-[#8EB800]">Tentar novamente</Text>
          </Pressable>
        ) : barbershops.length === 0 ? (
          <Text className="mt-8 text-center text-[#697170]">Nenhuma barbearia encontrada.</Text>
        ) : (
          <View className="flex-row flex-wrap justify-between px-4">
            {barbershops.map((item) => <BarberCard key={item.id} item={item} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
