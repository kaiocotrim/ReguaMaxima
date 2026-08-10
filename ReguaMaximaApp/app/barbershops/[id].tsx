import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SideMenu } from "../_components/SideMenu";
import { BookingSheet } from "../_components/BookingSheet";
import { type AuthUser, getStoredUser } from "../../services/auth";
import {
  type BarbershopDetails,
  getBarbershop,
} from "../../services/barbershops";

const BRAND = "#254F50";

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-9 min-w-[108px] flex-row items-center justify-center rounded-[11px] bg-white px-3 active:opacity-65"
    >
      <Ionicons name={icon} size={16} color="#9CDD00" />
      <Text
        className="ml-2 text-[12px] text-[#173F40]"
        style={{ fontFamily: "Satoshi-Bold" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ServiceCard({
  service,
  acceptsBookings,
  onSchedule,
}: {
  service: BarbershopDetails["services"][number];
  acceptsBookings: boolean;
  onSchedule: () => void;
}) {
  return (
    <View
      className="mb-4 flex-row rounded-[18px] border border-[#E2E5E3] bg-white p-3"
      style={{
        shadowColor: "#254F50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="h-[108px] w-[108px] overflow-hidden rounded-[14px] border border-[#B8F51C] bg-[#E8ECE9]">
        {service.imageUrl ? (
          <Image
            source={{ uri: service.imageUrl }}
            contentFit="cover"
            transition={180}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="cut-outline" size={30} color="#9CDD00" />
          </View>
        )}
      </View>

      <View className="ml-4 min-w-0 flex-1 py-1">
        <Text
          numberOfLines={1}
          className="text-[17px] text-[#254F50]"
          style={{ fontFamily: "Satoshi-Bold" }}
        >
          {service.name}
        </Text>
        <Text
          numberOfLines={2}
          className="mt-2 text-[12px] leading-[17px] text-[#707674]"
          style={{ fontFamily: "Satoshi-Regular" }}
        >
          {service.description || "Serviço especializado para você."}
        </Text>
        <View className="mt-auto flex-row items-end justify-between">
          <Text
            className="text-[18px] text-[#254F50]"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            {service.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Agendar ${service.name}`}
            disabled={!acceptsBookings}
            onPress={onSchedule}
            className={`h-8 items-center justify-center rounded-[10px] px-5 active:opacity-70 ${acceptsBookings ? "bg-[#B8F51C]" : "bg-[#DDE1DF]"}`}
          >
            <Text
              className="text-[12px] text-[#173F40]"
              style={{ fontFamily: "Satoshi-Bold" }}
            >
              {acceptsBookings ? "Agendar" : "Pausado"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function BarbershopPage() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [barbershop, setBarbershop] = useState<BarbershopDetails | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<"services" | "reviews">("services");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<
    BarbershopDetails["services"][number] | null
  >(null);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      setBarbershop(await getBarbershop(id));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar a barbearia.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void getStoredUser().then(setUser);
    void load();
  }, [load]);

  async function handleShare() {
    if (!barbershop) return;
    try {
      await Share.share({
        title: barbershop.name,
        message: `Conheça ${barbershop.name}: ${barbershop.address}`,
      });
    } catch {
      Alert.alert("Compartilhar", "Não foi possível abrir o compartilhamento.");
    }
  }

  function handleBack() {
    router.replace("/home");
  }

  function handleOpenMenu() {
    if (menuVisible) return;
    setMenuVisible(true);
  }

  function handleSchedule(service: BarbershopDetails["services"][number]) {
    if (!user) {
      Alert.alert("Entre na sua conta", "Faça login para realizar um agendamento.");
      return;
    }
    if (user.role !== "CLIENT") {
      Alert.alert("Agendamento", "Somente clientes podem realizar agendamentos.");
      return;
    }
    setSelectedService(service);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F7F3]">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  if (!barbershop || error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F7F3] px-8">
        <StatusBar style="dark" />
        <Ionicons name="storefront-outline" size={42} color="#9AA19F" />
        <Text
          className="mt-4 text-center text-[15px] text-[#606765]"
          style={{ fontFamily: "Satoshi-Medium" }}
        >
          {error || "Barbearia não encontrada."}
        </Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            void load();
          }}
          className="mt-5 rounded-xl bg-[#B8F51C] px-6 py-3"
        >
          <Text style={{ fontFamily: "Satoshi-Bold", color: BRAND }}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  const rating = barbershop.averageRating?.toFixed(1) ?? "Novo";

  return (
    <View className="flex-1 bg-[#F5F7F3]">
      <StatusBar style="dark" translucent />
      <SideMenu
        visible={menuVisible}
        user={user}
        onClose={() => setMenuVisible(false)}
      />
      <BookingSheet
        visible={Boolean(selectedService)}
        barbershopId={barbershop.id}
        service={selectedService}
        barbers={barbershop.barbers}
        onClose={() => setSelectedService(null)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={BRAND}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View
          className="relative h-[260px] overflow-visible"
          style={{ zIndex: 2 }}
        >
          <Image
            source={{ uri: barbershop.capaUrl || barbershop.imageUrl }}
            contentFit="cover"
            transition={180}
            style={{ width: "100%", height: "100%" }}
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-0 bottom-0 h-24 bg-black/10"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={handleBack}
            className="absolute left-4 h-11 w-11 items-center justify-center rounded-[13px] bg-white/95 active:opacity-70"
            style={{ top: insets.top + 10, zIndex: 30, elevation: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color={BRAND} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            onPress={handleOpenMenu}
            className="absolute right-4 h-11 w-11 items-center justify-center rounded-[13px] bg-white/95 active:opacity-70"
            style={{ top: insets.top + 10, zIndex: 30, elevation: 12 }}
          >
            <Ionicons name="menu-outline" size={23} color={BRAND} />
          </Pressable>

          <View
            className="absolute -bottom-10 left-6 h-[82px] w-[82px] rounded-full bg-white p-[5px]"
            style={{
              zIndex: 20,
              elevation: 8,
              shadowColor: "#173F40",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.18,
              shadowRadius: 6,
            }}
          >
            <View className="h-full w-full overflow-hidden rounded-full border-2 border-[#254F50] bg-white p-[3px]">
              <Image
                source={{ uri: barbershop.imageUrl }}
                contentFit="cover"
                style={{ width: "100%", height: "100%", borderRadius: 999 }}
              />
            </View>
          </View>
        </View>

        <View
          className="bg-white px-6 pb-5 pt-[58px]"
          style={{ zIndex: 1 }}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="text-[24px] text-[#75C900]"
                style={{ fontFamily: "Satoshi-Bold", letterSpacing: -0.5 }}
              >
                {barbershop.name}
              </Text>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="map-outline" size={16} color={BRAND} />
                <Text
                  numberOfLines={1}
                  className="ml-1.5 flex-1 text-[13px] text-[#254F50]"
                  style={{ fontFamily: "Satoshi-Bold" }}
                >
                  {barbershop.address}
                </Text>
                <Ionicons name="open-outline" size={14} color="#8C9491" />
              </View>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="star" size={15} color={BRAND} />
                <Text
                  className="ml-1.5 text-[13px] text-[#254F50]"
                  style={{ fontFamily: "Satoshi-Bold" }}
                >
                  {rating} · {barbershop.reviewCount} {barbershop.reviewCount === 1 ? "avaliação" : "avaliações"}
                </Text>
              </View>
            </View>

            <View className="gap-1.5">
              <ActionButton
                icon={favorite ? "heart" : "heart-outline"}
                label={favorite ? "Favorita" : "Favoritar"}
                onPress={() => setFavorite((current) => !current)}
              />
              <ActionButton icon="share-outline" label="Compartilhar" onPress={() => void handleShare()} />
              <ActionButton
                icon="person-circle-outline"
                label={`${barbershop.barbers.length} ${barbershop.barbers.length === 1 ? "barbeiro" : "barbeiros"}`}
              />
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          <View className="rounded-[17px] border border-[#DFE3E0] bg-white p-4">
            <Text
              className="text-[12px] uppercase text-[#254F50]"
              style={{ fontFamily: "Satoshi-Bold", letterSpacing: 0.35 }}
            >
              Sobre nós
            </Text>
            <Text
              className="mt-6 text-[14px] leading-[20px] text-[#254F50]"
              style={{ fontFamily: "Satoshi-Bold" }}
            >
              {barbershop.description || "Nenhuma descrição informada."}
            </Text>
          </View>
        </View>

        <View className="px-6 pt-8">
          <View className="h-[55px] flex-row rounded-[16px] border border-[#E0E3E1] bg-white p-1.5" style={{ elevation: 2 }}>
            <Pressable
              onPress={() => setTab("services")}
              className={`flex-1 flex-row items-center justify-center rounded-[11px] ${tab === "services" ? "bg-[#B8F51C]" : "bg-transparent"}`}
            >
              <Ionicons name="cut-outline" size={18} color={tab === "services" ? "#111111" : "#777D7B"} />
              <Text
                className={`ml-2 text-[14px] ${tab === "services" ? "text-black" : "text-[#6F7573]"}`}
                style={{ fontFamily: "Satoshi-Bold" }}
              >
                Serviços
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab("reviews")}
              className={`flex-1 flex-row items-center justify-center rounded-[11px] ${tab === "reviews" ? "bg-[#B8F51C]" : "bg-transparent"}`}
            >
              <Ionicons name="chatbox-outline" size={17} color={tab === "reviews" ? "#111111" : "#777D7B"} />
              <Text
                className={`ml-2 text-[14px] ${tab === "reviews" ? "text-black" : "text-[#6F7573]"}`}
                style={{ fontFamily: "Satoshi-Bold" }}
              >
                Avaliações
              </Text>
            </Pressable>
          </View>

          <View className="mt-5">
            {tab === "services" ? (
              barbershop.services.length > 0 ? (
                barbershop.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    acceptsBookings={barbershop.acceptsBookings}
                    onSchedule={() => handleSchedule(service)}
                  />
                ))
              ) : (
                <Text className="py-10 text-center text-[#737A77]" style={{ fontFamily: "Satoshi-Regular" }}>
                  Nenhum serviço cadastrado.
                </Text>
              )
            ) : barbershop.reviews.length > 0 ? (
              barbershop.reviews.map((review) => (
                <View key={review.id} className="mb-3 rounded-[16px] border border-[#E1E4E2] bg-white p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                      {review.userName}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color="#F5B800" />
                      <Text className="ml-1 text-[12px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                        {review.rating}/5
                      </Text>
                    </View>
                  </View>
                  {review.comment && (
                    <Text className="mt-3 text-[13px] leading-[19px] text-[#656C69]" style={{ fontFamily: "Satoshi-Regular" }}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text className="py-10 text-center text-[#737A77]" style={{ fontFamily: "Satoshi-Regular" }}>
                Ainda não existem avaliações para esta barbearia.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
