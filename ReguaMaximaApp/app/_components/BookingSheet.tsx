import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createBooking,
  getAvailableBarbers,
  getAvailableTimes,
} from "../../services/bookings";
import type { BarbershopDetails } from "../../services/barbershops";

type Service = BarbershopDetails["services"][number];
type Barber = BarbershopDetails["barbers"][number];

type BookingSheetProps = {
  visible: boolean;
  barbershopId: string;
  service: Service | null;
  barbers: Barber[];
  onClose: () => void;
};

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function BookingSheet({
  visible,
  barbershopId,
  service,
  barbers,
  onClose,
}: BookingSheetProps) {
  const insets = useSafeAreaInsets();
  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableBarberIds, setAvailableBarberIds] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [checkingBarbers, setCheckingBarbers] = useState(false);
  const [checkingTimes, setCheckingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedDate(null);
      setSelectedBarber(null);
      setSelectedTime(null);
      setAvailableBarberIds([]);
      setTimes([]);
      setError("");
      setSuccess(false);
    }
  }, [visible]);

  async function chooseDate(date: Date) {
    if (!service) return;
    const key = dateKey(date);
    setSelectedDate(key);
    setSelectedBarber(null);
    setSelectedTime(null);
    setTimes([]);
    setError("");
    setCheckingBarbers(true);
    try {
      setAvailableBarberIds(
        await getAvailableBarbers(barbershopId, service.id, key),
      );
    } catch (loadError) {
      setAvailableBarberIds([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível consultar a disponibilidade.",
      );
    } finally {
      setCheckingBarbers(false);
    }
  }

  async function chooseBarber(barberId: string) {
    if (!service || !selectedDate) return;
    setSelectedBarber(barberId);
    setSelectedTime(null);
    setTimes([]);
    setError("");
    setCheckingTimes(true);
    try {
      setTimes(
        await getAvailableTimes(
          barbershopId,
          service.id,
          barberId,
          selectedDate,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível consultar os horários.",
      );
    } finally {
      setCheckingTimes(false);
    }
  }

  async function confirmBooking() {
    if (!service || !selectedDate || !selectedBarber || !selectedTime) return;
    setSubmitting(true);
    setError("");
    try {
      await createBooking({
        barbershopId,
        serviceId: service.id,
        barberId: selectedBarber,
        date: selectedDate,
        time: selectedTime,
      });
      setSuccess(true);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "Não foi possível concluir o agendamento.",
      );
      if (selectedBarber) {
        try {
          setTimes(
            await getAvailableTimes(
              barbershopId,
              service.id,
              selectedBarber,
              selectedDate,
            ),
          );
          setSelectedTime(null);
        } catch {
          setTimes([]);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const availableBarbers = barbers.filter((barber) =>
    availableBarberIds.includes(barber.id),
  );
  const selectedBarberName =
    barbers.find((barber) => barber.id === selectedBarber)?.name ?? "Barbeiro";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/25">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="max-h-[90%] rounded-t-[28px] bg-[#F7F8F6]"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-14 rounded-full bg-[#C8CDCA]" />
          </View>

          <View className="flex-row items-center justify-between border-b border-[#E2E5E3] px-5 pb-4 pt-2">
            <View className="min-w-0 flex-1">
              <Text
                className="text-[20px] text-[#254F50]"
                style={{ fontFamily: "Satoshi-Bold" }}
              >
                Agende seu horário
              </Text>
              {service && (
                <Text
                  numberOfLines={1}
                  className="mt-1 text-[13px] text-[#6C7471]"
                  style={{ fontFamily: "Satoshi-Regular" }}
                >
                  {service.name} · {service.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityLabel="Fechar agendamento"
              onPress={onClose}
              className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-65"
            >
              <Ionicons name="close" size={22} color="#254F50" />
            </Pressable>
          </View>

          {success ? (
            <View className="min-h-[390px] items-center justify-center px-8">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-[#B8F51C]">
                <Ionicons name="checkmark" size={42} color="#254F50" />
              </View>
              <Text
                className="mt-5 text-[20px] text-[#254F50]"
                style={{ fontFamily: "Satoshi-Bold" }}
              >
                Agendamento confirmado!
              </Text>
              <Text
                className="mt-2 text-center text-[14px] leading-5 text-[#68706D]"
                style={{ fontFamily: "Satoshi-Regular" }}
              >
                {selectedDate?.split("-").reverse().join("/")} às {selectedTime}, com {selectedBarberName}.
              </Text>
              <Pressable
                onPress={onClose}
                className="mt-7 h-12 w-full items-center justify-center rounded-[14px] bg-[#254F50] active:opacity-70"
              >
                <Text style={{ fontFamily: "Satoshi-Bold", color: "white" }}>
                  Concluir
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="py-5">
                <Text
                  className="px-5 text-[14px] text-[#254F50]"
                  style={{ fontFamily: "Satoshi-Bold" }}
                >
                  1. Escolha a data
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 9, paddingHorizontal: 20, paddingTop: 14 }}
                >
                  {dates.map((date) => {
                    const key = dateKey(date);
                    const selected = selectedDate === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => void chooseDate(date)}
                        className={`w-[66px] items-center rounded-[14px] border py-3 ${selected ? "border-[#B8F51C] bg-[#B8F51C]" : "border-[#DFE3E0] bg-white"}`}
                      >
                        <Text className="text-[11px] uppercase text-[#68706D]" style={{ fontFamily: "Satoshi-Bold" }}>
                          {date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                        </Text>
                        <Text className="mt-1 text-[21px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                          {date.getDate()}
                        </Text>
                        <Text className="text-[11px] uppercase text-[#68706D]" style={{ fontFamily: "Satoshi-Medium" }}>
                          {date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {selectedDate && (
                <View className="border-t border-[#E2E5E3] px-5 py-5">
                  <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                    2. Escolha o barbeiro
                  </Text>
                  {checkingBarbers ? (
                    <ActivityIndicator className="my-7" color="#254F50" />
                  ) : availableBarbers.length === 0 ? (
                    <Text className="py-6 text-center text-[13px] text-[#747B78]" style={{ fontFamily: "Satoshi-Regular" }}>
                      Não há barbeiros disponíveis nesta data.
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 14 }}>
                      {availableBarbers.map((barber) => {
                        const selected = selectedBarber === barber.id;
                        return (
                          <Pressable
                            key={barber.id}
                            onPress={() => void chooseBarber(barber.id)}
                            className={`w-[112px] items-center rounded-[15px] border p-3 ${selected ? "border-[#B8F51C] bg-[#F3FFCF]" : "border-[#DFE3E0] bg-white"}`}
                          >
                            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#E9ECEA]">
                              {barber.avatar ? (
                                <Image source={{ uri: barber.avatar }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
                              ) : (
                                <Ionicons name="person" size={22} color="#254F50" />
                              )}
                            </View>
                            <Text numberOfLines={1} className="mt-2 text-[12px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                              {barber.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}

              {selectedBarber && (
                <View className="border-t border-[#E2E5E3] px-5 py-5">
                  <Text className="text-[14px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                    3. Escolha o horário
                  </Text>
                  {checkingTimes ? (
                    <ActivityIndicator className="my-7" color="#254F50" />
                  ) : times.length === 0 ? (
                    <Text className="py-6 text-center text-[13px] text-[#747B78]" style={{ fontFamily: "Satoshi-Regular" }}>
                      Nenhum horário disponível para este barbeiro.
                    </Text>
                  ) : (
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      {times.map((time) => (
                        <Pressable
                          key={time}
                          onPress={() => setSelectedTime(time)}
                          className={`min-w-[70px] items-center rounded-[11px] border px-3 py-2.5 ${selectedTime === time ? "border-[#B8F51C] bg-[#B8F51C]" : "border-[#DFE3E0] bg-white"}`}
                        >
                          <Text className="text-[13px] text-[#254F50]" style={{ fontFamily: "Satoshi-Bold" }}>
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {error ? (
                <View className="mx-5 mb-4 rounded-[12px] bg-red-50 p-3">
                  <Text className="text-center text-[12px] text-red-600" style={{ fontFamily: "Satoshi-Medium" }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="px-5 pb-6">
                <Pressable
                  disabled={!selectedDate || !selectedBarber || !selectedTime || submitting}
                  onPress={() => void confirmBooking()}
                  className={`h-14 flex-row items-center justify-center rounded-[16px] ${selectedDate && selectedBarber && selectedTime && !submitting ? "bg-[#B8F51C]" : "bg-[#DDE1DF]"}`}
                >
                  {submitting && <ActivityIndicator size="small" color="#254F50" />}
                  <Text className={`${submitting ? "ml-3" : ""} text-[15px] text-[#254F50]`} style={{ fontFamily: "Satoshi-Bold" }}>
                    {submitting ? "Confirmando..." : "Confirmar agendamento"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
