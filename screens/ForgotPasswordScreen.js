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

export default ForgotPasswordScreen = () => {
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
        onPress={() => setForgottedAccount(false)} // Возврат на главную при аутентификации
      >
        <Text>Вернуться назад</Text>
      </Pressable>

      <Text>Восстановить аккаунт {checkedNewName}</Text>
      <TextInput
        style={styles.input}
        placeholder="Секретный ключ"
        // Обновляем состояние при изменении текста
        onChangeText={(e) => setSecretKey(e)}
      // Привязка значения к input
      />
      <Pressable
        style={styles.topButton}
        onPress={() => forgotAccount(secretKey)}
      >
        <Text>Восстановить Аккаунт</Text>
      </Pressable>
    </>
  </View >
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