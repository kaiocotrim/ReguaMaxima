import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { updateClientProfile } from "../services/client";

const TOTAL_STEPS = 4;

export default function ClientOnboardingScreen() {
  const insets = useSafeAreaInsets();

  const cidadeInputRef = useRef<TextInput>(null);
  const telefoneInputRef = useRef<TextInput>(null);

  const [step, setStep] = useState(1);

  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const progress = `${Math.round(
    (step / TOTAL_STEPS) * 100,
  )}%`;

  async function handlePickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso às suas fotos para escolher uma imagem de perfil.",
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const selectedImage = result.assets[0];

      if (!selectedImage?.uri) {
        Alert.alert(
          "Erro ao selecionar foto",
          "Não foi possível carregar a imagem selecionada.",
        );

        return;
      }

      setAvatar(selectedImage.uri);
    } catch (error) {
      console.error(
        "Erro ao selecionar imagem:",
        error,
      );

      Alert.alert(
        "Erro",
        "Não foi possível abrir sua galeria.",
      );
    }
  }

  function validateCurrentStep() {
    if (step === 1) {
      const normalizedName = nome.trim();

      if (
        normalizedName.length < 2 ||
        normalizedName.length > 80
      ) {
        Alert.alert(
          "Nome inválido",
          "Digite um nome entre 2 e 80 caracteres.",
        );

        return false;
      }
    }

    if (step === 2) {
      if (!avatar) {
        Alert.alert(
          "Foto obrigatória",
          "Escolha uma foto para continuar.",
        );

        return false;
      }
    }

    if (step === 3) {
      const normalizedCity = cidade.trim();

      if (
        normalizedCity.length < 2 ||
        normalizedCity.length > 100
      ) {
        Alert.alert(
          "Cidade inválida",
          "Digite sua cidade ou região.",
        );

        return false;
      }
    }

    if (step === 4) {
      const normalizedPhone =
        telefone.trim();

      if (
        normalizedPhone.length < 8 ||
        normalizedPhone.length > 30
      ) {
        Alert.alert(
          "Telefone inválido",
          "Digite um telefone válido.",
        );

        return false;
      }
    }

    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    void handleFinish();
  }

  function handleBack() {
    if (isLoading) {
      return;
    }

    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }

    router.back();
  }

  async function handleFinish() {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsLoading(true);

      await updateClientProfile({
        nome: nome.trim(),
        avatar,
        cidade: cidade.trim(),
        telefone: telefone.trim(),
      });

      router.replace("/home");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir seu perfil.";

      Alert.alert(
        "Erro ao salvar perfil",
        message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  function renderStepOne() {
    return (
      <>
        <View className="items-center">
          <View className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#C3F32C]">
            <Ionicons
              name="person-outline"
              size={34}
              color="#244C4E"
            />
          </View>

          <Text className="mt-6 text-center text-[30px] font-bold tracking-[-0.8px] text-[#244C4E]">
            Como podemos te chamar?
          </Text>

          <Text className="mt-3 max-w-[330px] text-center text-[15px] leading-6 text-gray-500">
            Esse será o nome exibido no seu perfil.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="mb-2 text-sm font-semibold text-[#244C4E]">
            Seu nome
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Kaio Cotrim"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            selectionColor="#244C4E"
            editable={!isLoading}
            onSubmitEditing={handleNext}
            className="h-[58px] w-full rounded-2xl border border-gray-200 bg-white px-[18px] text-base text-[#244C4E]"
          />
        </View>
      </>
    );
  }

  function renderStepTwo() {
    return (
      <>
        <View className="items-center">
          <View className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#C3F32C]">
            <Ionicons
              name="camera-outline"
              size={34}
              color="#244C4E"
            />
          </View>

          <Text className="mt-6 text-center text-[30px] font-bold tracking-[-0.8px] text-[#244C4E]">
            Escolha uma foto
          </Text>

          <Text className="mt-3 max-w-[330px] text-center text-[15px] leading-6 text-gray-500">
            Adicione uma foto para deixar seu perfil mais completo.
          </Text>
        </View>

        <View className="mt-10 items-center">
          <Pressable
            onPress={handlePickImage}
            disabled={isLoading}
            className="h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-full border-[4px] border-[#C3F32C] bg-white active:opacity-80"
          >
            {avatar ? (
              <Image
                source={{
                  uri: avatar,
                }}
                resizeMode="cover"
                className="h-full w-full"
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={58}
                color="#244C4E"
              />
            )}
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            disabled={isLoading}
            className="mt-6 flex-row items-center rounded-full bg-white px-6 py-3.5 active:opacity-70"
          >
            <Ionicons
              name="image-outline"
              size={20}
              color="#244C4E"
            />

            <Text className="ml-2 font-bold text-[#244C4E]">
              Escolher foto
            </Text>
          </Pressable>

          {avatar && (
            <Pressable
              onPress={() => setAvatar(null)}
              disabled={isLoading}
              className="mt-4"
            >
              <Text className="text-sm font-semibold text-gray-400">
                Remover foto
              </Text>
            </Pressable>
          )}
        </View>
      </>
    );
  }

  function renderStepThree() {
    return (
      <>
        <View className="items-center">
          <View className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#C3F32C]">
            <Ionicons
              name="location-outline"
              size={34}
              color="#244C4E"
            />
          </View>

          <Text className="mt-6 text-center text-[30px] font-bold tracking-[-0.8px] text-[#244C4E]">
            Onde você está?
          </Text>

          <Text className="mt-3 max-w-[340px] text-center text-[15px] leading-6 text-gray-500">
            Informe sua cidade para encontrarmos barbearias próximas de você.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="mb-2 text-sm font-semibold text-[#244C4E]">
            Cidade / região
          </Text>

          <View className="h-[58px] w-full flex-row items-center rounded-2xl border border-gray-200 bg-white px-[18px]">
            <Ionicons
              name="location-outline"
              size={21}
              color="#9CA3AF"
            />

            <TextInput
              ref={cidadeInputRef}
              value={cidade}
              onChangeText={setCidade}
              placeholder="Ex: São Paulo, SP"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              selectionColor="#244C4E"
              editable={!isLoading}
              onSubmitEditing={handleNext}
              className="ml-3 h-full flex-1 text-base text-[#244C4E]"
            />
          </View>
        </View>
      </>
    );
  }

  function renderStepFour() {
    return (
      <>
        <View className="items-center">
          <View className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#C3F32C]">
            <Ionicons
              name="call-outline"
              size={34}
              color="#244C4E"
            />
          </View>

          <Text className="mt-6 text-center text-[30px] font-bold tracking-[-0.8px] text-[#244C4E]">
            Qual é o seu telefone?
          </Text>

          <Text className="mt-3 max-w-[340px] text-center text-[15px] leading-6 text-gray-500">
            Informe seu número para completar seu perfil.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="mb-2 text-sm font-semibold text-[#244C4E]">
            Telefone
          </Text>

          <View className="h-[58px] w-full flex-row items-center rounded-2xl border border-gray-200 bg-white px-[18px]">
            <Ionicons
              name="call-outline"
              size={21}
              color="#9CA3AF"
            />

            <TextInput
              ref={telefoneInputRef}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              returnKeyType="done"
              selectionColor="#244C4E"
              editable={!isLoading}
              onSubmitEditing={() => {
                void handleFinish();
              }}
              className="ml-3 h-full flex-1 text-base text-[#244C4E]"
            />
          </View>

          <Text className="mt-3 text-sm leading-5 text-gray-400">
            Seu número será usado apenas para recursos relacionados à sua conta.
          </Text>
        </View>
      </>
    );
  }

  function renderCurrentStep() {
    switch (step) {
      case 1:
        return renderStepOne();

      case 2:
        return renderStepTwo();

      case 3:
        return renderStepThree();

      case 4:
        return renderStepFour();

      default:
        return null;
    }
  }

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <View className="w-full max-w-[420px] flex-1 self-center">
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={handleBack}
                  disabled={isLoading}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-70"
                >
                  <Ionicons
                    name="arrow-back"
                    size={23}
                    color="#244C4E"
                  />
                </Pressable>

                <View className="items-end">
                  <Text className="text-sm font-bold text-[#244C4E]">
                    {step} / {TOTAL_STEPS}
                  </Text>

                  <Text className="mt-0.5 text-xs text-gray-400">
                    Perfil do cliente
                  </Text>
                </View>
              </View>

              <View className="mt-6 h-[7px] overflow-hidden rounded-full bg-gray-200">
                <View
                  className="h-full rounded-full bg-[#C3F32C]"
                  style={{
                    width: progress,
                  }}
                />
              </View>

              <View className="flex-1 justify-center py-10">
                {renderCurrentStep()}

                <Pressable
                  onPress={handleNext}
                  disabled={isLoading}
                  className={`mt-10 h-[58px] w-full flex-row items-center justify-center rounded-[24px] bg-[#C3F32C] ${
                    isLoading
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#244C4E"
                      />

                      <Text className="ml-3 text-base font-extrabold text-[#244C4E]">
                        Salvando...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-base font-extrabold text-[#244C4E]">
                        {step === TOTAL_STEPS
                          ? "Concluir"
                          : "Continuar"}
                      </Text>

                      <Ionicons
                        name={
                          step === TOTAL_STEPS
                            ? "checkmark"
                            : "chevron-forward"
                        }
                        size={20}
                        color="#244C4E"
                        style={{
                          marginLeft: 6,
                        }}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}