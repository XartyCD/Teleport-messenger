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
import { useAppContext } from "../context/context.js"

export default LoginScreen = ({ navigation, route }) => {
  const { checkedNewName } = route.params || {}; // Деструктурируем параметры при navigate
  const { setUser, setSessionId, checkInternetConnection, CONNECTURL } = useAppContext()

  const [nameWarn, setnameWarn] = useState("хэ") // варн вверху экрана
  const [inputedKey, setInputedKey] = useState()


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
        setnameWarn("Слишком короткий! (от 10-х)")
      } else if (inputedKey.length > 50) {
        setnameWarn("Слишком длинный (до 50-ти)")
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
            // Прописать бан при неправильном ключе !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            alert("Неверный ключ")

          } else if (data.message === "Аккаунт уже используется") {
            alert("Аккаунт уже используется")

          } else if (data.message === "Перегенерировать сессию") {
            checkInputedKey() // повторный вызов если ключ вдруг совпал

          } else {
            // Пропускаем при правильном ключе
            console.log("Вход:")
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

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={styles.warnSetNickname}>{nameWarn}</Text>
      <>
        <Pressable
          style={styles.topButton}
          onPress={() => navigation.navigate("RegisterScreen")} // Возврат на главную при аутентификации
        >
          <Text>Вернуться назад</Text>
        </Pressable>

        <Text>Введите ключ от аккаунта {checkedNewName} для авторизации.</Text>
        <TextInput
          style={styles.input}
          placeholder="Секретный ключ"
          // Обновляем состояние при изменении текста
          onChangeText={(e) => setInputedKey(e)}
        // Привязка значения к input
        />
        <Pressable
          style={styles.topButton}
          onPress={() => checkInputedKey()}
        >
          <Text>Продолжить</Text>
        </Pressable>
      </>
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