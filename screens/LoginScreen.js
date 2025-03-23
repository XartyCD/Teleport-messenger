import {
  Platform,
  StyleSheet,
  TextInput,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native"
import React, { useState, useContext, useEffect, useRef } from "react"
import { Audio } from "expo-av";
import { Image, ImageBackground } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useAppContext } from "../context/context.js"

import AnimatedNotification from "../components/AnimatedNotification.js";

export default LoginScreen = ({ navigation, route }) => {
  const { checkedNewName } = route.params || {}; // Деструктурируем параметры при navigate

  const [notification, setNotification] = useState("");
  const [notificationTrigger, setNotificationTrigger] = useState(0);

  const [sound, setSound] = useState();
  const [error, setError] = useState(false); // состояние для ошибки
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);


  const ERROR_SOUND = require('../assets/sounds/errorLogin.wav');
  const SUCCESS_SOUND = require('../assets/sounds/successLogin.wav');


  const { setUser, setSessionId, setUserId, checkInternetConnection, CONNECTURL } = useAppContext()

  const [inputedKey, setInputedKey] = useState()


  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationTrigger((prev) => prev + 1); // Меняем `trigger`, чтобы обновить компонент
  };


  // Функция для воспроизведения звука
  const playSound = async (soundFile) => {
    const { sound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: true });
    setSound(sound);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync(); // Освобождаем ресурсы после окончания воспроизведения
      }
    });
  };


  // Генерация случайного session id
  const createUniqueSessionId = async () => {
    const minLength = 10
    const maxLength = 25
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" // Символы, которые могут быть в ключе
    const keyLength =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength

    let generatedSessionId = ""
    for (let i = 0; i < keyLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      generatedSessionId += characters[randomIndex]
    }

    return generatedSessionId
  }

  // Проверка ключа при авторизации
  const checkInputedKey = async () => {
    console.log(inputedKey)
    const connected = await checkInternetConnection()
    if (connected) {
      if (inputedKey.length <= 10) {
        showNotification("Слишком короткий! (от 10-и)")
      } else if (inputedKey.length > 50) {
        showNotification("Слишком длинный (до 50-ти)")
      } else {
        const generatedSessionId = await createUniqueSessionId() // Создаем sessionId

        try {
          const response = await fetch(`${CONNECTURL}/confirmsecretkey`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: checkedNewName,
              key: inputedKey,
              sessionId: generatedSessionId,
            }),
          })

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.message)
          }

          if (data.message === "Неверный ключ") {
            showNotification("Неверный ключ");
            setError(true); // Устанавливаем ошибку
            playSound(ERROR_SOUND);
            setTimeout(() => {
              setError(false); // Скрываем GIF через 3 секунды
            }, 900);

          } else if (data.message === "Аккаунт уже используется") {
            showNotification("Аккаунт уже используется")

          } else if (data.message === "Перегенерировать сессию") {
            checkInputedKey() // повторный вызов если ключ вдруг совпал

          } else {
            playSound(SUCCESS_SOUND);
            setSuccessModalVisible(true);

            setTimeout(() => {
              // Пропускаем при правильном ключе
              setSuccessModalVisible(false);

              console.log("Вход:")
              setUser(checkedNewName);
              setSessionId(generatedSessionId);
              setUserId(data.id);
            }, 1750);



          }
        } catch (error) {
          console.error("Ошибка при отправке данных:", error)
        }

      }
    } else {
      showNotification("Нет подключения к интернету!")
    }
  }

  return (
    <>
      {isSuccessModalVisible && (
        <View style={styles.successOverlay}>
          <View style={styles.successBackground} />
          <Image
            source={require("../assets/gifs/successLogin.gif")}
            style={styles.successGif}
            contentFit="cover"
          />
        </View>
      )}

      <ImageBackground
        source={require('../assets/images/loginScreenBack.jpg')} // Замените на ваш URL изображения
        style={{
          flex: 1, // Растягивает изображение на весь экран
          color: "white",
        }}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.5)']}
          style={{
            position: 'absolute', // Абсолютное позиционирование для наложения градиента
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >

          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatedNotification message={notification} trigger={notificationTrigger} />
            <>

              <Pressable onPress={() => navigation.navigate("RegisterScreen")} style={styles.buttonBack}>
                <View style={styles.contentbackbtn}>
                  <Ionicons name={"chevron-back-outline"} size={24} color="white" />
                  <Text style={styles.backtext}>Войти в другой аккаунт</Text>
                </View>
              </Pressable>


              {error ? (
                <Image
                  source={require("../assets/gifs/wrongPassword.gif")}
                  style={{
                    width: 80,
                    height: 80,
                  }}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require("../assets/images/stateLocker.png")} // Здесь указываем обычное изображение
                  style={{
                    width: 80,
                    height: 80,
                  }}
                  contentFit="cover"
                />
              )}
              <Text style={styles.infoInputKeyText}>Введите ключ от аккаунта {checkedNewName} для авторизации.</Text>
              <TextInput
                style={styles.input}
                placeholder="Секретный ключ"
                placeholderTextColor="#fff"
                // Обновляем состояние при изменении текста
                onChangeText={(e) => setInputedKey(e)}
                value={inputedKey}
              // Привязка значения к input
              />
              <View style={styles.continueButton}>
                <LinearGradient
                  colors={["rgb(4, 125, 130)", "rgb(103, 9, 192)"]}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.btnGradientBorder}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      pressed && styles.btnPressed
                    ]}
                    onPress={() => checkInputedKey()}
                  >
                    <Text style={styles.btnText}>Войти</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </>
          </View>
        </LinearGradient>
      </ImageBackground >
    </>
  )
}

const styles = StyleSheet.create({
  contentbackbtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  backtext: {
    color: 'white',
    fontSize: 16
  },
  buttonBack: {
    borderColor: "grey",
    borderWidth: 1.4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginBottom: 70,
    position: "absolute",
    top: 95,
    left: 10

  },

  infoInputKeyText: {
    color: 'white',
    fontFamily: 'UbuntuCondensed-Regular',
    fontSize: 20,
    textAlign: "center",
    marginTop: 30
  },
  input: {
    width: "70%",
    height: 50,
    borderBottomWidth: 2, // Только нижняя граница
    borderBottomColor: "#6200ee", // Цвет границы
    paddingHorizontal: 10,
    fontSize: 18,
    backgroundColor: "transparent", // Прозрачный фон
    marginVertical: 7,
    color: "white",
  },

  // Кнопка "Войти"
  btnGradientBorder: {
    padding: 2.2,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "#141414dd",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  btnText: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",

    fontFamily: "UbuntuCondensed-Regular",
  },
  btnPressed: {
    backgroundColor: "#333",
  },
  continueButton: {
    width: "40%",
    marginTop: 40,
    marginBottom: 40
  },


  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10, // Поверх остального контента
  },
  successBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)", // Затемненный фон
  },

  successGif: {
    position: "absolute",
    top: 210,
    width: 250,
    height: 250,
  },

})