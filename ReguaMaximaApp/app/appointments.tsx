import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import {
  type Appointment,
  cancelBooking,
  listAppointments,
} from "../services/bookings";
import { type AuthUser, getStoredUser } from "../services/auth";
import { SideMenu } from "./_components/SideMenu";

const BRAND = "#254F50";
const LIME = "#B8F51C";

type Tab = "upcoming" | "history";

function formatPrice(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Valor a confirmar";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusInfo(appointment: Appointment) {
  if (appointment.status === "CANCELADO") {
    return { label: "Cancelado", color: "#B42318", background: "#FEE4E2" };
  }
  if (appointment.status === "CONCLUIDO" || new Date(appointment.date) < new Date()) {
    return { label: "Concluído", color: BRAND, background: "#E7EFEC" };
  }
  return { label: "Confirmado", color: BRAND, background: LIME };
}

function AppointmentCard({
  appointment,
  cancelling,
  onCancel,
}: {
  appointment: Appointment;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const date = new Date(appointment.date);
  const status = statusInfo(appointment);
  const canCancel =
    appointment.status === "EM_ANDAMENTO" && date.getTime() > Date.now();
  const barberName =
    appointment.barber?.nome || appointment.barber?.user.name || null;
  const duration = appointment.durationMinutes ?? appointment.service.duration;

  return (
    <View
      className="mb-4 overflow-hidden rounded-[20px] border border-[#DFE3E0] bg-white"
      style={{
        shadowColor: "#173F40",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View className="flex-row border-b border-[#EDF0EE] p-4">
        <View className="h-[62px] w-[62px] overflow-hidden rounded-[17px] bg-[#E8ECE9]">
          <Image
            source={{ uri: appointment.barbershop.imageUrl }}
            contentFit="cover"
            transition={150}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <View
            className="self-start rounded-full px-2.5 py-1"
            style={{ backgroundColor: status.background }}
          >
            <Text
              className="text-[11px]"
              style={{ fontFamily: "Satoshi-Bold", color: status.color }}
            >
              {status.label}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className="mt-2 text-[16px] text-[#173F40]"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            {appointment.service.name}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-0.5 text-[13px] text-[#65706D]"
            style={{ fontFamily: "Satoshi-Medium" }}
          >
            {appointment.barbershop.name}
          </Text>
        </View>
        <View className="ml-2 items-end">
          <Text className="text-[22px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
            {date.getDate().toString().padStart(2, "0")}
          </Text>
          <Text className="text-[12px] uppercase text-[#65706D]" style={{ fontFamily: "Satoshi-Bold" }}>
            {date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
          </Text>
        </View>
      </View>

      <View className="gap-3 px-4 py-4">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={17} color={BRAND} />
          <Text className="ml-2 text-[13px] text-[#3F5553]" style={{ fontFamily: "Satoshi-Medium" }}>
            {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {" às "}
            {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {appointment.barbershop.address && (
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={17} color={BRAND} />
            <Text numberOfLines={1} className="ml-2 flex-1 text-[13px] text-[#3F5553]" style={{ fontFamily: "Satoshi-Medium" }}>
              {appointment.barbershop.address}
            </Text>
          </View>
        )}
        {(barberName || duration) && (
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={17} color={BRAND} />
            <Text className="ml-2 text-[13px] text-[#3F5553]" style={{ fontFamily: "Satoshi-Medium" }}>
              {[barberName, duration ? `${duration} min` : null].filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between border-t border-[#EDF0EE] px-4 py-3.5">
        <Text className="text-[18px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
          {formatPrice(appointment.agreedPrice)}
        </Text>
        {canCancel && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar agendamento"
            disabled={cancelling}
            onPress={onCancel}
            className="min-h-[42px] min-w-[108px] items-center justify-center rounded-[12px] border border-[#E9A8A3] px-4 active:bg-[#FFF1F0]"
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#B42318" />
            ) : (
              <Text className="text-[13px] text-[#B42318]" style={{ fontFamily: "Satoshi-Bold" }}>
                Cancelar
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AppointmentsPage() {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setAppointments(await listAppointments());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar seus agendamentos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void getStoredUser().then(setUser);
    void load();
  }, [load]);

  const visibleAppointments = useMemo(() => {
    const now = Date.now();
    return appointments.filter((appointment) => {
      const upcoming =
        appointment.status === "EM_ANDAMENTO" &&
        new Date(appointment.date).getTime() >= now;
      return tab === "upcoming" ? upcoming : !upcoming;
    });
  }, [appointments, tab]);

  function confirmCancellation(appointment: Appointment) {
    Alert.alert(
      "Cancelar agendamento?",
      `Deseja cancelar ${appointment.service.name} na ${appointment.barbershop.name}?`,
      [
        { text: "Manter", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: () => {
            setCancellingId(appointment.id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
            void cancelBooking(appointment.id)
              .then(() => {
                setAppointments((current) =>
                  current.map((item) =>
                    item.id === appointment.id ? { ...item, status: "CANCELADO" } : item,
                  ),
                );
                setTab("history");
                Alert.alert("Agendamento cancelado", "Ele foi movido para o seu histórico.");
              })
              .catch((cancelError: unknown) => {
                Alert.alert(
                  "Não foi possível cancelar",
                  cancelError instanceof Error ? cancelError.message : "Tente novamente em instantes.",
                );
              })
              .finally(() => setCancellingId(null));
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-[#F6F7F5]">
      <StatusBar style="dark" />
      <SideMenu visible={menuVisible} user={user} onClose={() => setMenuVisible(false)} />

      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E9E7] bg-white">
        <View className="h-[64px] flex-row items-center justify-between px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/home")}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"
          >
            <Ionicons name="chevron-back" size={24} color={BRAND} />
          </Pressable>
          <Text className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>
            Agendamentos
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            onPress={() => setMenuVisible(true)}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"
          >
            <Ionicons name="menu-outline" size={25} color={BRAND} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={BRAND}
            onRefresh={() => { setRefreshing(true); void load(); }}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View className="bg-[#254F50] px-5 pb-8 pt-7">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#B8F51C]">
            <Ionicons name="calendar" size={22} color={BRAND} />
          </View>
          <Text className="mt-4 text-[28px] leading-[34px] text-white" style={{ fontFamily: "Satoshi-Black", letterSpacing: -0.6 }}>
            Seus agendamentos
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-[#D7E2DE]" style={{ fontFamily: "Satoshi-Regular" }}>
            Acompanhe os próximos horários e consulte seu histórico.
          </Text>
        </View>

        <View className="mx-4 -mt-4 flex-row rounded-[16px] border border-[#DFE3E0] bg-white p-1.5">
          {(["upcoming", "history"] as const).map((item) => {
            const selected = tab === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setTab(item)}
                className={`h-11 flex-1 items-center justify-center rounded-[12px] ${selected ? "bg-[#B8F51C]" : "bg-transparent"}`}
              >
                <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: selected ? "Satoshi-Bold" : "Satoshi-Medium" }}>
                  {item === "upcoming" ? "Próximos" : "Histórico"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="px-4 pt-6">
          {loading ? (
            <ActivityIndicator size="large" color={BRAND} className="mt-12" />
          ) : error ? (
            <Pressable onPress={() => void load()} className="items-center rounded-[20px] border border-[#DFE3E0] bg-white px-6 py-10">
              <Ionicons name="cloud-offline-outline" size={36} color="#81908C" />
              <Text className="mt-3 text-center text-[14px] text-[#65706D]" style={{ fontFamily: "Satoshi-Medium" }}>{error}</Text>
              <Text className="mt-3 text-[14px] text-[#7DBB00]" style={{ fontFamily: "Satoshi-Bold" }}>Tentar novamente</Text>
            </Pressable>
          ) : visibleAppointments.length === 0 ? (
            <View className="items-center rounded-[20px] border border-[#DFE3E0] bg-white px-6 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F0F6E5]">
                <Ionicons name={tab === "upcoming" ? "calendar-outline" : "time-outline"} size={27} color="#8BCB00" />
              </View>
              <Text className="mt-4 text-center text-[17px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                {tab === "upcoming" ? "Nenhum horário agendado" : "Seu histórico está vazio"}
              </Text>
              <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>
                {tab === "upcoming" ? "Escolha uma barbearia e marque seu próximo corte." : "Os agendamentos finalizados e cancelados aparecerão aqui."}
              </Text>
              {tab === "upcoming" && (
                <Pressable onPress={() => router.replace("/home")} className="mt-5 h-11 items-center justify-center rounded-[12px] bg-[#B8F51C] px-6 active:opacity-70">
                  <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Encontrar barbearia</Text>
                </Pressable>
              )}
            </View>
          ) : (
            visibleAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                cancelling={cancellingId === appointment.id}
                onCancel={() => confirmCancellation(appointment)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
