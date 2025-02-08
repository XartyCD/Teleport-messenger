import {
  Platform,
  StyleSheet,
  TextInput,
  Text,
  View,
  Pressable,
  Image,
  Alert,
} from "react-native"
import React, { useState, useContext, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAppContext } from "../context/context.js"
import NetInfo from "@react-native-community/netinfo"

import * as Clipboard from "expo-clipboard"

export default RegisterScreen = ({ navigation }) => {
  const [nameWarn, setnameWarn] = useState("хэ") // варн вверху экрана
  const { getAllDataFromAsyncStorage, setUser, setSessionId, appVersion, checkInternetConnection, CONNECTURL } = useAppContext()
  const [checkedNewName, setCheckedNewName] = useState("") // состояние для некнейма с лицевой страницы

  const [createKey, setCreateKey] = useState(null) // требуется вввод пароля при новой регистрации? (если ник не занят)
  const [secretKey, setSecretKey] = useState(null) // состояние для вводимого ключа при регистрации

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
  getAllDataFromAsyncStorage()


  const askAccount = () => {
    Alert.alert("Такой никнейм уже занят", "Это ваш аккаунт?", [
      { text: "Нет", style: "cancel" },
      { text: "Да", onPress: () => openLogin() },
    ])
  }

  const askCreatingSecretKey = () => {
    Alert.alert(
      "Защита лосося",
      "Хотите сгенерировать случайный секретный ключ, или введёте вручную?",
      [
        { text: "Ввести вручную", onPress: () => setCreateKey(true) },
        { text: "Сгенерировать случайно", onPress: () => createRandomSK() },
      ]
    )
  }

  const openLogin = async () => {
    const connected = await checkInternetConnection(true)
    if (connected) {
      navigation.navigate("LoginScreen", { checkedNewName });
    } else {
      alert("Нет подключения к интернету!")
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

    Alert.alert(
      "Ваш ключ успешно сгенерирован",
      `${randomKey} \n\nОБЯЗАТЕЛЬНО СОХРАНИТЕ ЕГО!`,
      [
        {
          text: "Скопировать и сохранить ключ",
          onPress: () => {
            Clipboard.setStringAsync(randomKey)
            checkInputedKey(randomKey)
          },
        },
      ]
    )
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
        setnameWarn("Слишком короткий! (от 10-х)")
      } else if (secretKey.length > 50) {
        setnameWarn("Слишком длинный (до 50-ти)")
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
          }
        } catch (error) {
          console.error("Ошибка при отправке данных:", error)
        }
      }
    } else {
      setnameWarn("Нет подключения к интернету!")
    }
  }

  const saveUserName = async () => {
    const connected = await checkInternetConnection()
    if (connected) {
      if (checkedNewName === "" || checkedNewName.length <= 4) {
        setnameWarn("Слишком короткий! (от 4-х)")
      } else if (checkedNewName.length > 16) {
        setnameWarn("Слишком длинный (до 16-ти)")
      } else if (
        blackListNames.some((word) =>
          checkedNewName.toLowerCase().includes(word.toLowerCase())
        )
      ) {
        setnameWarn("Имя неприемлимо")
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
            askAccount()
          } else {
            askCreatingSecretKey()
          }
        } catch (error) {
          console.error("Ошибка при отправке данных:", error)
        }
      }
    } else {
      setnameWarn("Нет подключения к интернету!")
    }
  }


  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={styles.warnSetNickname}>{nameWarn}</Text>

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
          <Text>Здравствуйте, как к вам обращаться?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ваше имя (никнейм)"
            // Обновляем состояние при изменении текста
            onChangeText={(e) => setCheckedNewName(e)}
          // Привязка значения к input
          />
          <Pressable style={styles.topButton} onPress={() => saveUserName()}>
            <Text>Продолжить</Text>
          </Pressable>
        </>
      )}

      <Text style={styles.version}>v.{appVersion}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  warnSetNickname: {
    padding: 4,
    backgroundColor: "#ff4f4fdb",
    color: "white",
    fontSize: 16,
  },
  topButton: {
    padding: 10,
    backgroundColor: "#c7c7c7d2",
    borderRadius: 30,
  },
  version: {
    margin: 100,
    fontSize: 14,
    color: "#e307b3",
  },
})