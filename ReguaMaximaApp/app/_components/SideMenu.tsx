import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AuthUser, clearSession } from "../../services/auth";

type IconName = ComponentProps<typeof Ionicons>["name"];

type MenuItem = {
  icon: IconName;
  label: string;
  description: string;
  route?: "/home";
  onlyBarber?: boolean;
  onlyClient?: boolean;
};

const ITEMS: MenuItem[] = [
  {
    icon: "home-outline",
    label: "Início",
    description: "Volte para tela de início",
    route: "/home",
  },
  {
    icon: "cut-outline",
    label: "Minha Barbearia",
    description: "Gerencie sua barbearia",
    onlyBarber: true,
  },
  {
    icon: "calendar-outline",
    label: "Agendamentos",
    description: "Agendamentos e histórico",
    onlyClient: true,
  },
  {
    icon: "heart-outline",
    label: "Favoritos",
    description: "Seus favoritos",
  },
  {
    icon: "notifications-outline",
    label: "Notificações",
    description: "Avisos sobre seus agendamentos",
  },
  {
    icon: "person-outline",
    label: "Perfil",
    description: "Faça seu trabalho falar por você.",
    onlyBarber: true,
  },
  {
    icon: "card-outline",
    label: "Plano",
    description: "Assinatura dos planos",
    onlyBarber: true,
  },
  {
    icon: "mail-outline",
    label: "Inbox",
    description: "Veja seus convites e notificações.",
    onlyBarber: true,
  },
  {
    icon: "settings-outline",
    label: "Configurações",
    description: "Ajustes da conta",
  },
  {
    icon: "diamond-outline",
    label: "Régua Máxima",
    description: "Projeto Régua Máxima",
  },
];

async function selectionFeedback() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // O feedback tátil é opcional e não pode interromper a navegação.
  }
}

type SideMenuProps = {
  visible: boolean;
  user: AuthUser | null;
  onClose: () => void;
};

export function SideMenu({ visible, user, onClose }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width - 24, 360);
  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    translateX.setValue(panelWidth);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        stiffness: 250,
        damping: 27,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, panelWidth, translateX, visible]);

  const role = user?.role;
  const visibleItems = ITEMS.filter(
    (item) => !item.onlyBarber || role === "BARBER",
  ).filter((item) => !item.onlyClient || role === "CLIENT");

  const initials =
    user?.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  function close(afterClose?: () => void) {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: panelWidth,
        duration: 210,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      afterClose?.();
    });
  }

  function handleItem(item: MenuItem) {
    void selectionFeedback();
    if (item.route) {
      close(() => router.replace(item.route!));
      return;
    }
    Alert.alert(item.label, "Esta área será implementada na próxima etapa.");
  }

  function confirmLogout() {
    Alert.alert(
      "Sair da conta?",
      "Sua sessão será encerrada e você precisará entrar novamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar saída",
          style: "destructive",
          onPress: async () => {
            await clearSession();
            close(() => router.replace("/"));
          },
        },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => close()}
    >
      <View className="flex-1 flex-row">
        <Animated.View
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-black/20"
        >
          <Pressable
            accessibilityLabel="Fechar menu"
            onPress={() => close()}
            className="h-full w-full"
          />
        </Animated.View>

        <Animated.View
          style={{
            width: panelWidth,
            marginLeft: "auto",
            paddingTop: insets.top,
            transform: [{ translateX }],
            shadowColor: "#000000",
            shadowOffset: { width: -12, height: 0 },
            shadowOpacity: 0.16,
            shadowRadius: 28,
            elevation: 18,
          }}
          className="h-full bg-[#FAFAFA]"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            hitSlop={10}
            onPress={() => close()}
            className="absolute right-4 z-10 h-11 w-11 items-center justify-center"
            style={{ top: insets.top + 4 }}
          >
            <Ionicons name="close-outline" size={25} color="#254F50" />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 48,
              paddingBottom: insets.bottom + 24,
            }}
          >
            {user && (
              <View className="flex-row items-center rounded-[18px] border border-[#DFE2E0] bg-white p-4">
                <View className="relative">
                  <View className="h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[17px] bg-[#0C0C0C]">
                    {user.image ? (
                      <Image
                        source={{ uri: user.image }}
                        contentFit="cover"
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <Text
                        className="text-[16px] text-white"
                        style={{ fontFamily: "Satoshi-Bold" }}
                      >
                        {initials}
                      </Text>
                    )}
                  </View>
                  <View className="absolute -bottom-2 -right-2 flex-row items-center rounded-full border-2 border-white bg-[#B8F51C] px-1.5 py-0.5">
                    <Ionicons
                      name={role === "BARBER" ? "cut" : "person"}
                      size={9}
                      color="#254F50"
                    />
                    <Text
                      className="ml-0.5 text-[9px] text-[#254F50]"
                      style={{ fontFamily: "Satoshi-Black" }}
                    >
                      {role === "BARBER" ? "BAR" : "VIP"}
                    </Text>
                  </View>
                </View>

                <View className="ml-4 min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] text-[#173F40]"
                    style={{ fontFamily: "Satoshi-Bold" }}
                  >
                    {user.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[12px] text-[#606765]"
                    style={{ fontFamily: "Satoshi-Regular" }}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
            )}

            <View className="mt-4 overflow-hidden rounded-[18px] border border-[#DFE2E0] border-l-[#B8F51C] bg-white px-5 py-[18px]" style={{ borderLeftWidth: 3 }}>
              <Text
                className="text-[20px] leading-[25px] text-[#254F50]"
                style={{ fontFamily: "Satoshi-Black", letterSpacing: -0.35 }}
              >
                {role === "BARBER"
                  ? "Mais um cliente para deixar na "
                  : "Vai deixar o cabelo na "}
                <Text className="text-[#8DD400]">régua?</Text>
              </Text>
              <Text
                className="mt-1 text-[11px] text-[#737977]"
                style={{ fontFamily: "Satoshi-Medium" }}
              >
                Régua <Text className="text-[#94D623]">Máxima.</Text>
              </Text>
            </View>

            <View className="mb-3 mt-24 flex-row items-center px-1">
              <Text
                className="text-[10px] uppercase text-[#747A78]"
                style={{ fontFamily: "Satoshi-Bold", letterSpacing: 1.6 }}
              >
                Menu
              </Text>
              <View className="ml-3 h-px flex-1 bg-[#DDE0DE]" />
            </View>

            <View className="gap-1">
              {visibleItems.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  onPress={() => handleItem(item)}
                  className="min-h-[61px] flex-row items-center rounded-[15px] border border-[#DFE2E0] bg-white px-3 active:bg-[#F2F6EF]"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8DD] bg-[#F5FAEA]">
                    <Ionicons name={item.icon} size={18} color="#A6E800" />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[14px] text-[#254F50]"
                      style={{ fontFamily: "Satoshi-Bold" }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-[11px] text-[#606765]"
                      style={{ fontFamily: "Satoshi-Regular" }}
                    >
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7B817F" />
                </Pressable>
              ))}
            </View>

            {user && (
              <Pressable
                accessibilityRole="button"
                onPress={confirmLogout}
                className="mt-5 h-12 flex-row items-center rounded-[14px] border border-red-100 bg-white px-4 active:bg-red-50"
              >
                <Ionicons name="log-out-outline" size={19} color="#EF4444" />
                <Text
                  className="ml-3 text-[14px] text-red-500"
                  style={{ fontFamily: "Satoshi-Medium" }}
                >
                  Sair da conta
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
