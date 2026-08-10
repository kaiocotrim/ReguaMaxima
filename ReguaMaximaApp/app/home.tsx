import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { type Href, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  type GestureResponderEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type AuthUser,
  getStoredUser,
} from "../services/auth";
import { SideMenu } from "./_components/SideMenu";
import {
  type Barbershop,
  listBarbershops,
} from "../services/barbershops";

const BRAND = "#254F50";
const LIME = "#B8F51C";
const SITE = "https://reguamaxima.cotrimdev.com.br";

async function selectionFeedback() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // O feedback tátil é opcional e não pode interromper a ação principal.
  }
}

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const categories = [
  { label: "Cabelo", icon: "content-cut", service: "Cabelo" },
  { label: "Barba", icon: "mustache", service: "Barba" },
  { label: "Acabamento", icon: "briefcase", service: "Acabamento" },
  { label: "Barbearias perto", icon: "store", service: "" },
] as const;

type FluidPressableProps = PropsWithChildren<{
  className?: string;
  accessibilityLabel?: string;
  onPress?: (event: GestureResponderEvent) => void;
  haptic?: boolean;
}>;

function FluidPressable({
  children,
  className,
  accessibilityLabel,
  onPress,
  haptic = false,
}: FluidPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateScale(toValue: number) {
    Animated.spring(scale, {
      toValue,
      stiffness: 420,
      damping: 28,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPressIn={() => animateScale(0.97)}
        onPressOut={() => animateScale(1)}
        onPress={(event) => {
          if (haptic) void selectionFeedback();
          onPress?.(event);
        }}
        className={className}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function BarberCard({
  item,
  index,
  reduceMotion,
}: {
  item: Barbershop;
  index: number;
  reduceMotion: boolean;
}) {
  const rating = item.averageRating?.toFixed(1) ?? "Novo";
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 12)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: Math.min(index, 5) * 35,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 230,
        damping: 25,
        mass: 1,
        delay: Math.min(index, 5) * 35,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, reduceMotion, translateY]);

  return (
    <Animated.View
      className="mb-4 w-[48.5%] overflow-hidden rounded-[18px] border border-[#E3E6E4] bg-white p-2"
      style={{
        opacity,
        transform: [{ translateY }],
        shadowColor: "#163E3F",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View className="relative h-[136px] overflow-hidden rounded-[14px] bg-[#E8ECE9]">
        <Image
          source={{ uri: item.imageUrl }}
          contentFit="cover"
          transition={180}
          style={{ width: "100%", height: "100%" }}
        />
        <View className="absolute left-2 top-2 flex-row items-center rounded-full bg-[#B8F51C] px-2 py-1">
          <Ionicons name="star" size={12} color={BRAND} />
          <Text
            className="ml-1 text-[12px] font-extrabold text-[#254F50]"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            {rating}
          </Text>
        </View>
      </View>

      <View className="px-1 pb-1 pt-3">
        <Text
          numberOfLines={1}
          className="text-[14px] font-extrabold text-[#173F40]"
          style={{ fontFamily: "Satoshi-Bold" }}
        >
          {item.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 text-[13px] text-[#727A78]"
          style={{ fontFamily: "Satoshi-Regular" }}
        >
          {item.address}
        </Text>
        <FluidPressable
          haptic
          accessibilityLabel={`Agendar na ${item.name}`}
          onPress={() =>
            router.push(`/barbershops/${item.id}` as Href)
          }
          className="mt-3 h-[34px] flex-row items-center justify-center rounded-[10px] bg-[#B8F51C]"
        >
          <Text
            className="text-[13px] font-extrabold text-[#254F50]"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            Agendar
          </Text>
          <Ionicons name="chevron-forward" size={17} color={BRAND} style={{ marginLeft: 8 }} />
        </FluidPressable>
      </View>
    </Animated.View>
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
  const [reduceMotion, setReduceMotion] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const today = capitalizeFirst(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(new Date()),
  );

  const greeting = user?.name
    ? user.role === "BARBER"
      ? `${user.name} vamos trabalhar hoje?`
      : `${user.name} corte novo hoje?`
    : "iremos alinhar o cabelo?";

  useEffect(() => {
    void getStoredUser().then(setUser);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

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

  function openMenu() {
    void selectionFeedback();
    setMenuVisible(true);
  }

  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <StatusBar style="dark" />
      <SideMenu
        visible={menuVisible}
        user={user}
        onClose={() => setMenuVisible(false)}
      />
      <View
        style={{
          paddingTop: insets.top,
          shadowColor: "#173F40",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
        }}
        className="z-10 bg-[#FAFAFA]"
      >
        <View className="h-[66px] flex-row items-center justify-between px-[20px]">
          <Image
            source={{ uri: `${SITE}/LogoMComBorder3.png` }}
            contentFit="contain"
            style={{ width: 54, height: 31 }}
          />
          <FluidPressable
            accessibilityLabel="Abrir menu"
            onPress={openMenu}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Ionicons name="menu-outline" size={24} color={BRAND} />
          </FluidPressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={BRAND} onRefresh={() => { setRefreshing(true); void loadBarbershops(); }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View className="px-5 pb-[18px] pt-5">
          <Text
            accessibilityRole="header"
            className="text-[20px] font-extrabold leading-[25px] text-[#254F50]"
            style={{
              fontFamily: "Satoshi-Bold",
              letterSpacing: -0.3,
            }}
          >
            Olá, <Text className="text-[#79CA00]">{greeting}</Text>
          </Text>
          <Text
            className="mt-1 text-[13px] font-bold text-[#626866]"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            {today}
          </Text>
        </View>

        <View className="px-4">
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
                style={{ fontFamily: "Satoshi-Medium" }}
              />
            </View>
            <FluidPressable
              haptic
              accessibilityLabel="Pesquisar barbearias"
              onPress={() => void loadBarbershops()}
              className="h-[43px] w-[43px] items-center justify-center rounded-[12px] bg-[#254F50]"
            >
              <Ionicons name="search-outline" size={20} color={LIME} />
            </FluidPressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingVertical: 24 }}>
          {categories.map((category) => {
            const selected = selectedService === category.service && category.service !== "";
            return (
              <FluidPressable
                key={category.label}
                haptic
                accessibilityLabel={`Filtrar por ${category.label}`}
                onPress={() => { setSelectedService(category.service); void loadBarbershops("", category.service); }}
                className={`h-[36px] flex-row items-center rounded-[12px] border px-4 ${selected ? "border-[#B8F51C] bg-[#B8F51C]" : "border-[#ECEEED] bg-white"}`}
              >
                <MaterialCommunityIcons name={category.icon} size={17} color={BRAND} />
                <Text
                  className="ml-2 text-[14px] font-bold text-[#254F50]"
                  style={{ fontFamily: "Satoshi-Bold" }}
                >
                  {category.label}
                </Text>
              </FluidPressable>
            );
          })}
        </ScrollView>

        <View className="mx-4 h-[151px] overflow-hidden rounded-[18px] border border-[#E1E5E2] bg-white">
          <Image
            source={{ uri: `${SITE}/bannerReguaM-light1.png` }}
            contentFit="cover"
            transition={180}
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <View className="mb-5 mt-6 flex-row items-center justify-between px-[18px]">
          <Text
            className="text-[12px] font-extrabold uppercase text-[#163E3F]"
            style={{
              fontFamily: "Satoshi-Bold",
              letterSpacing: 0.35,
            }}
          >
            Recomendações
          </Text>
          <View className="flex-row items-center gap-4">
            <Text
              className="text-[12px] font-bold text-[#727674]"
              style={{ fontFamily: "Satoshi-Bold" }}
            >
              Todas
            </Text>
            <Text
              className="text-[12px] font-extrabold text-[#8FCF00]"
              style={{ fontFamily: "Satoshi-Bold" }}
            >
              Mapa
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND} className="mt-10" />
        ) : error ? (
          <Pressable onPress={() => void loadBarbershops()} className="mx-5 items-center rounded-2xl bg-white p-6">
            <Text
              className="text-center text-[#697170]"
              style={{ fontFamily: "Satoshi-Regular" }}
            >
              {error}
            </Text>
            <Text
              className="mt-2 font-bold text-[#8EB800]"
              style={{ fontFamily: "Satoshi-Bold" }}
            >
              Tentar novamente
            </Text>
          </Pressable>
        ) : barbershops.length === 0 ? (
          <Text
            className="mt-8 text-center text-[#697170]"
            style={{ fontFamily: "Satoshi-Regular" }}
          >
            Nenhuma barbearia encontrada.
          </Text>
        ) : (
          <View className="flex-row flex-wrap justify-between px-4">
            {barbershops.map((item, index) => (
              <BarberCard
                key={item.id}
                item={item}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
