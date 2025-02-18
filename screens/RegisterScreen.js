import {
  Platform,
  StyleSheet,
  TextInput,
  Text,
  View,
  Pressable,
  ImageBackground,
  Animated
} from "react-native"
import React, { useState, useContext, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard"

import { useAppContext } from "../context/context.js"
import AnimatedNotification from "../components/AnimatedNotification.js";
import ModalRegister from '../components/ModalRegister.js';

export default RegisterScreen = ({ navigation }) => {
  const [notification, setNotification] = useState("");
  const [notificationTrigger, setNotificationTrigger] = useState(0);
  const [isModalSecureMetodVisible, setIsModalSecureMetodVisible] = useState(false);
  const [isModalGeneratedVisible, setIsModalGeneratedVisible] = useState(false);
  const [isModalAskAccountVisible, setIsModalAskAccountVisible] = useState(false);

  const { getAllDataFromAsyncStorage, setUser, setSessionId, appVersion, checkInternetConnection, CONNECTURL } = useAppContext()
  const [checkedNewName, setCheckedNewName] = useState("") // состояние для некнейма с лицевой страницы

  const [createKey, setCreateKey] = useState(null) // требуется вввод пароля при новой регистрации? (если ник не занят)
  const [secretKey, setSecretKey] = useState(null) // состояние для вводимого ключа при регистрации

  const [firstLineLetters, setFirstLineLetters] = useState([]);
  const [secondLineLetters, setSecondLineLetters] = useState([]);

  const blackListNames = [
    "nigger",
    "Ниггер",
    "Нигер",
    "Зеленский",
    "Макрон",
    "Niga",
    "Nigga",
    "Негр",
    "Negr",
    "Райан Гослинг",
    "Пабло Эксобар",
    "Байден",
    "Putin",
    "Путин",
    ".",
    "&",
    "?",
    "-",
    "~",
    "Зюзьга",
  ]

  // Функция для разделения текста на буквы и анимации
  const createAnimatedLetters = (text) => {
    const [firstLine, secondLine] = text.split('\n'); // делим на две строки
    const firstLineAnimations = firstLine.split('').map((char, index) => {
      const letterOpacity = new Animated.Value(0); // изначально opacity 0
      Animated.timing(letterOpacity, {
        toValue: 1,
        duration: 500,
        delay: index * 70, // задержка для каждой буквы
        useNativeDriver: true,
      }).start();
      return { char, opacity: letterOpacity };
    });
    const secondLineAnimations = secondLine.split('').map((char, index) => {
      const letterOpacity = new Animated.Value(0); // изначально opacity 0
      Animated.timing(letterOpacity, {
        toValue: 1,
        duration: 500,
        delay: (firstLine.length + index) * 100, // задержка для второй строки
        useNativeDriver: true,
      }).start();
      return { char, opacity: letterOpacity };
    });

    setFirstLineLetters(firstLineAnimations);
    setSecondLineLetters(secondLineAnimations);
  };

  // Запускаем анимацию при монтировании компонента
  useEffect(() => {
    createAnimatedLetters('Здравствуйте,\nкак к вам обращаться?');
  }, []);



  const openLogin = async () => {
    const connected = await checkInternetConnection()
    if (connected) {
      navigation.navigate("LoginScreen", { checkedNewName });
    } else {
      showNotification("Нет подключения к интернету!")
    }
  }

  // Первичная проверка имени на валидность и оригинальность (проверка на повтор имени)
  const saveUserName = async () => {
    const connected = await checkInternetConnection()
    if (connected) {
      if (checkedNewName === "" || checkedNewName.length <= 4) {
        showNotification("Слишком короткий! (от 4-х)")
      } else if (checkedNewName.length > 16) {
        showNotification("Слишком длинный (до 16-ти)")
      } else if (
        blackListNames.some((word) =>
          checkedNewName.toLowerCase().includes(word.toLowerCase())
        )
      ) {
        showNotification("Имя неприемлимо")
      } else {
        try {
          const response = await fetch(`${CONNECTURL}/checkusers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ checkedNewName }),
          })

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.message)
          }

          if (data.success === "already user") {
            setIsModalAskAccountVisible(true)
          } else {
            setIsModalSecureMetodVisible(true)
          }
        } catch (error) {
          console.error("Ошибка при отправке данных:", error)
        }
      }
    } else {
      showNotification("Нет подключения к интернету!")
    }
  }

  // Генерация случайного ключа
  const createRandomSK = async () => {
    const minLength = 26
    const maxLength = 50
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?" // Символы, которые могут быть в ключе
    const keyLength =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength

    let randomKey = ""
    for (let i = 0; i < keyLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      randomKey += characters[randomIndex]
    }
    setSecretKey(randomKey)
    setIsModalGeneratedVisible(true)
  }


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

  // Проверка ключа при регистрации/при авторизации
  const checkInputedKey = async (secretKey) => {
    console.log(secretKey)
    const connected = await checkInternetConnection()
    if (connected) {
      if (secretKey.length <= 10) {
        showNotification("Слишком короткий! (от 10-х)")
      } else if (secretKey.length > 50) {
        showNotification("Слишком длинный (до 50-ти)")
      } else {
        const generatedSessionId = await createUniqueSessionId() // Создаем sessionId
        try {
          const response = await fetch(`${CONNECTURL}/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ checkedNewName, secretKey, sessionId: generatedSessionId }),
          })

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.message)
          } else {
            // Пропускаем в аккаунт
            setUser(checkedNewName) // Записываем валидное введенное имя в состояние
            setSessionId(generatedSessionId)
            getAllDataFromAsyncStorage()
          }
        } catch (error) {
          console.error("Ошибка при отправке данных:", error)
        }
      }
    } else {
      showNotification("Нет подключения к интернету!")
    }
  }

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationTrigger((prev) => prev + 1); // Меняем `trigger`, чтобы обновить компонент
  };

  const saveKeyAndSuccessRegister = () => {
    Clipboard.setStringAsync(secretKey)
    checkInputedKey(secretKey)
    setIsModalGeneratedVisible(false)
  };


  return (
    <ImageBackground
      source={require('../assets/images/authBack.jpg')} // Замените на ваш URL изображения
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.gradient}
      >
        <View style={styles.overlay}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <AnimatedNotification message={notification} trigger={notificationTrigger} />

            {/* Модальные окна */}

            <ModalRegister
              visible={isModalSecureMetodVisible}
              onClose={() => setIsModalSecureMetodVisible(false)}
              title="Защита аккаунта"
              message="Хотите сгенерировать случайный секретный ключ, или придумаете свой?"
              options={[
                { text: 'Ввести вручную', onPress: () => setCreateKey(true) },
                { text: 'Сгенерировать случайно', onPress: () => createRandomSK() },
              ]}
            />

            <ModalRegister
              visible={isModalAskAccountVisible}
              onClose={() => setIsModalAskAccountVisible(false)}
              title="Такой логин уже занят"
              message={`${checkedNewName} — ваш аккаунт?`}
              options={[
                { text: "Нет", onPress: () => setIsModalAskAccountVisible(false) },
                { text: "Да", onPress: () => openLogin() },
              ]}
            />

            <ModalRegister
              visible={isModalGeneratedVisible}
              onClose={() => saveKeyAndSuccessRegister()}
              title="Защита аккаунта"
              message={`Ваш ключ успешно сгенерирован:\n\n${secretKey} \n\nОБЯЗАТЕЛЬНО СОХРАНИТЕ ЕГО!`}
              options={[
                {
                  text: "Скопировать и сохранить ключ",
                  onPress: () => setIsModalGeneratedVisible(false)
                }
              ]}
            />

            {/* Модальные окна */}


            {createKey ? (
              <>
                <Pressable
                  style={styles.topButton}
                  onPress={() => setCreateKey(false)} // Возврат на главную при регистрации
                >
                  <Text>Вернуться назад</Text>
                </Pressable>

                <Text>Создайте ключ для аккаунта {checkedNewName}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Секретный ключ"
                  // Обновляем состояние при изменении текста
                  onChangeText={(e) => setSecretKey(e)}
                // Привязка значения к input
                />
                <Pressable
                  style={styles.topButton}
                  onPress={() => checkInputedKey(secretKey)}
                >
                  <Text>Продолжить</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.infoTextWrapper}>
                  {/* Первая строка */}
                  <View style={styles.textRow}>
                    {firstLineLetters.map((letter, index) => (
                      <Animated.Text key={index} style={[styles.infoText, { opacity: letter.opacity }]}>
                        {letter.char}
                      </Animated.Text>
                    ))}
                  </View>
                  {/* Вторая строка */}
                  <View style={styles.textRow}>
                    {secondLineLetters.map((letter, index) => (
                      <Animated.Text key={index} style={[styles.infoText, { opacity: letter.opacity }]}>
                        {letter.char}
                      </Animated.Text>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ваш логин (никнейм)"
                  placeholderTextColor="#fff"
                  onChangeText={setCheckedNewName}
                  value={checkedNewName}

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
                      onPress={() => saveUserName()}
                    >
                      <Text style={styles.btnText}>Продолжить</Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </>
            )}

            <Text style={styles.version}>v.{appVersion}</Text>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // Растягивает изображение на весь экран
    color: "white",
  },
  gradient: {
    position: 'absolute', // Абсолютное позиционирование для наложения градиента
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
  },
  infoTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    marginBottom: 40
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  infoText: {
    color: 'white',
    fontFamily: 'Lobster-Regular',
    fontSize: 26,
  },
  topButton: {
    padding: 10,
    backgroundColor: "#c7c7c7d2",
    borderRadius: 30,
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

  // Кнопка "Продолжить"
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
    width: "50%",
    marginTop: 80,
  },
  // Кнопка "Продолжить"

  version: {
    margin: 100,
    fontSize: 14,
    color: "#e307b3",
    fontFamily: "Merienda-VariableFont_wght",
  },
})