import { Ionicons } from "@expo/vector-icons";
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

import { type AuthUser, getStoredUser } from "../services/auth";
import {
  type UserNotification,
  listNotifications,
  markNotificationsRead,
} from "../services/notifications";
import { SideMenu } from "./_components/SideMenu";

const BRAND = "#254F50";

function NotificationCard({ item, onPress }: { item: UserNotification; onPress: () => void }) {
  const unread = !item.readAt;
  const date = new Date(item.createdAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? "Não lida: " : ""}${item.title}`}
      onPress={onPress}
      className={`mb-3 flex-row rounded-[18px] border p-4 active:opacity-75 ${unread ? "border-[#B8E85B] bg-[#FBFFF4]" : "border-[#DFE3E0] bg-white"}`}
    >
      <View className={`h-11 w-11 items-center justify-center rounded-[13px] ${unread ? "bg-[#B8F51C]" : "bg-[#EFF3F0]"}`}>
        <Ionicons name={item.bookingId ? "calendar-outline" : "notifications-outline"} size={21} color={BRAND} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row items-start">
          <Text className="min-w-0 flex-1 text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{item.title}</Text>
          {unread && <View className="ml-2 mt-1 h-2.5 w-2.5 rounded-full bg-[#8ED000]" />}
        </View>
        <Text className="mt-1 text-[13px] leading-[19px] text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>{item.message}</Text>
        <Text className="mt-2 text-[11px] text-[#8A9390]" style={{ fontFamily: "Satoshi-Medium" }}>
          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          {" · "}
          {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      {item.bookingId && <Ionicons name="chevron-forward" size={17} color="#89928F" style={{ marginLeft: 6, marginTop: 13 }} />}
    </Pressable>
  );
}

export default function NotificationsPage() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const unreadCount = useMemo(() => notifications.filter(({ readAt }) => !readAt).length, [notifications]);

  const load = useCallback(async () => {
    try {
      setError("");
      setNotifications(await listNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar suas notificações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void getStoredUser().then(setUser);
    void load();
  }, [load]);

  async function openNotification(item: UserNotification) {
    if (!item.readAt) {
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, readAt } : notification));
      try {
        await markNotificationsRead(item.id);
      } catch {
        void load();
        return;
      }
    }
    if (item.bookingId) router.push("/appointments");
  }

  async function markAll() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await markNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
    } catch (markError) {
      Alert.alert("Não foi possível atualizar", markError instanceof Error ? markError.message : "Tente novamente.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F6F7F5]">
      <StatusBar style="dark" />
      <SideMenu visible={menuVisible} user={user} onClose={() => setMenuVisible(false)} />
      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E9E7] bg-white">
        <View className="h-16 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="chevron-back" size={24} color={BRAND} /></Pressable>
          <Text className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>Notificações</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={() => setMenuVisible(true)} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="menu-outline" size={25} color={BRAND} /></Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={BRAND} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        <View className="bg-[#597511] px-5 pb-7 pt-6">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#B8F51C]"><Ionicons name="notifications" size={22} color={BRAND} /></View>
          <Text className="mt-4 text-[27px] text-white" style={{ fontFamily: "Satoshi-Black", letterSpacing: -0.5 }}>Seus avisos</Text>
          <Text className="mt-1 text-[14px] text-[#D7E2DE]" style={{ fontFamily: "Satoshi-Regular" }}>Atualizações importantes sobre seus agendamentos.</Text>
          <View className="mt-5 flex-row items-center justify-between border-t border-white/15 pt-4">
            <Text className="text-[13px] text-white" style={{ fontFamily: "Satoshi-Medium" }}><Text style={{ color: "#B8F51C", fontFamily: "Satoshi-Bold" }}>{unreadCount}</Text> {unreadCount === 1 ? "não lida" : "não lidas"}</Text>
            {unreadCount > 0 && (
              <Pressable disabled={markingAll} onPress={() => void markAll()} className="min-h-10 justify-center rounded-[11px] border border-white/25 px-3 active:opacity-70">
                <Text className="text-[12px] text-white" style={{ fontFamily: "Satoshi-Bold" }}>{markingAll ? "Atualizando..." : "Marcar todas como lidas"}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="px-4 pt-6">
          {loading ? <ActivityIndicator size="large" color={BRAND} className="mt-12" /> : error ? (
            <Pressable onPress={() => void load()} className="items-center rounded-[20px] border border-[#DFE3E0] bg-white px-6 py-10">
              <Ionicons name="cloud-offline-outline" size={35} color="#82908C" />
              <Text className="mt-3 text-center text-[14px] text-[#65706D]" style={{ fontFamily: "Satoshi-Medium" }}>{error}</Text>
              <Text className="mt-3 text-[14px] text-[#7DBB00]" style={{ fontFamily: "Satoshi-Bold" }}>Tentar novamente</Text>
            </Pressable>
          ) : notifications.length === 0 ? (
            <View className="items-center rounded-[20px] border border-dashed border-[#CBD2CE] bg-white px-6 py-12">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F0F6E5]"><Ionicons name="notifications-outline" size={27} color="#8BCB00" /></View>
              <Text className="mt-4 text-[17px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>Nenhuma notificação</Text>
              <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#65706D]" style={{ fontFamily: "Satoshi-Regular" }}>Quando houver uma atualização, ela aparecerá aqui.</Text>
            </View>
          ) : notifications.map((item) => <NotificationCard key={item.id} item={item} onPress={() => void openNotification(item)} />)}
        </View>
      </ScrollView>
    </View>
  );
}
