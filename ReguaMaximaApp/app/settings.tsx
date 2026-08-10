import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AuthUser, clearSession, getStoredUser } from "../services/auth";
import { SideMenu } from "./_components/SideMenu";

const BRAND = "#254F50";
const SITE = "https://reguamaxima.cotrimdev.com.br";
type IconName = ComponentProps<typeof Ionicons>["name"];

function SettingRow({ icon, title, description, onPress, trailing, danger = false }: {
  icon: IconName; title: string; description: string; onPress?: () => void;
  trailing?: ReactNode; danger?: boolean;
}) {
  const color = danger ? "#C9382D" : BRAND;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      className="min-h-[72px] flex-row items-center border-b border-[#EDF0EE] px-4 py-3 last:border-b-0 active:bg-[#F4F7F4]"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-[12px] ${danger ? "bg-[#FFF0EF]" : "bg-[#F0F6E5]"}`}>
        <Ionicons name={icon} size={20} color={danger ? "#D14A40" : "#8DCC00"} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-[14px]" style={{ fontFamily: "Satoshi-Bold", color }}>{title}</Text>
        <Text className="mt-0.5 text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Regular" }}>{description}</Text>
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color="#8B9491" /> : null)}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-2 px-1 text-[11px] uppercase text-[#6D7774]" style={{ fontFamily: "Satoshi-Bold", letterSpacing: 1.1 }}>{title}</Text>
      <View className="overflow-hidden rounded-[18px] border border-[#DFE3E0] bg-white">{children}</View>
    </View>
  );
}

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  useEffect(() => { void getStoredUser().then(setUser); }, []);

  function confirmLogout() {
    Alert.alert("Sair da conta?", "Você precisará entrar novamente para acessar seus dados.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void clearSession().then(() => router.replace("/")) },
    ]);
  }

  async function openHelp() {
    try {
      await Linking.openURL(`${SITE}/ajuda`);
    } catch {
      Alert.alert("Central de ajuda", "Não foi possível abrir a central de ajuda.");
    }
  }

  const initials = user?.name.split(" ").slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U";

  return (
    <View className="flex-1 bg-[#F6F7F5]">
      <StatusBar style="dark" />
      <SideMenu visible={menuVisible} user={user} onClose={() => setMenuVisible(false)} />
      <View style={{ paddingTop: insets.top }} className="border-b border-[#E6E9E7] bg-white">
        <View className="h-16 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="chevron-back" size={24} color={BRAND} /></Pressable>
          <Text className="text-[17px] text-[#173F40]" style={{ fontFamily: "Satoshi-Bold" }}>Configurações</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={() => setMenuVisible(true)} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#EEF2EF]"><Ionicons name="menu-outline" size={25} color={BRAND} /></Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}>
        <View className="mt-5 flex-row items-center rounded-[20px] bg-[#254F50] p-5">
          <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-[19px] bg-[#173D3E]">
            {user?.image ? <Image source={{ uri: user.image }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <Text className="text-[18px] text-white" style={{ fontFamily: "Satoshi-Bold" }}>{initials}</Text>}
          </View>
          <View className="ml-4 min-w-0 flex-1">
            <Text numberOfLines={1} className="text-[18px] text-white" style={{ fontFamily: "Satoshi-Bold" }}>{user?.name || "Minha conta"}</Text>
            <Text numberOfLines={1} className="mt-1 text-[13px] text-[#D7E2DE]" style={{ fontFamily: "Satoshi-Regular" }}>{user?.email || "Dados da conta"}</Text>
            {user && <View className="mt-2 self-start rounded-full bg-[#B8F51C] px-2.5 py-1"><Text className="text-[10px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>{user.role === "BARBER" ? "BARBEIRO" : "CLIENTE"}</Text></View>}
          </View>
        </View>

        <Section title="Preferências">
          <SettingRow icon="phone-portrait-outline" title="Aparência" description="O aplicativo acompanha o tema do dispositivo" trailing={<Text className="text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Medium" }}>Automático</Text>} />
        </Section>
        <Section title="Suporte">
          <SettingRow icon="help-circle-outline" title="Central de ajuda" description="Manual de uso da Régua Máxima" onPress={() => void openHelp()} />
          <SettingRow icon="information-circle-outline" title="Sobre o aplicativo" description="Régua Máxima para mobile" trailing={<Text className="text-[12px] text-[#68736F]" style={{ fontFamily: "Satoshi-Medium" }}>v{version}</Text>} />
        </Section>
        <Section title="Sessão">
          <SettingRow icon="log-out-outline" title="Sair da conta" description="Encerrar esta sessão no dispositivo" danger onPress={confirmLogout} />
        </Section>
        <Text className="mt-7 text-center text-[11px] text-[#8A9390]" style={{ fontFamily: "Satoshi-Regular" }}>Régua Máxima · versão {version}</Text>
      </ScrollView>
    </View>
  );
}
