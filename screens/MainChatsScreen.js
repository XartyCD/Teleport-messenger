import AsyncStorage from "@react-native-async-storage/async-storage"
import { StatusBar } from "expo-status-bar"
import {
  AppState,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  Animated,
} from "react-native"
import React, { useState, useEffect, useRef } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useAppContext } from "../context/context.js"

export default MainChatScreen = () => {
  return (
    <View>
      <View>
        {/* Технический Top блок */}
        <View style={styles.userBlock}>


          <View style={styles.changeSalmon}>
            <LinearGradient
              colors={["rgb(1, 110, 218)", "rgb(217, 0, 192)"]} // Градиентные цвета
              start={[0, 0]}
              end={[1, 1]}
              style={styles.btnGradientBorder}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  pressed && styles.btnPressed, // Эффект при нажатии
                ]}
                onPress={() => console.log("Button Pressed")}
              >
                <Text style={styles.btnText}>Сменить валюту</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </View>
      <ScrollView style={styles.mainWrapper}>
        <Pressable style={styles.resetButton} onPress={() => console.log("Button Pressed")}>
          <Text style={styles.resetText}>Выйти из аккаунтa</Text>
        </Pressable>

        <Pressable style={styles.resetButton} onPress={() => console.log("Button Pressed")}>
          <Text style={styles.resetText}>Сбросить прогресс</Text>
        </Pressable>

        <StatusBar style="auto" />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  // Главные тап кнопки
  mainWrapper: {
    backgroundColor: "orange",
    height: "100%"
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 25,
  },
  upgradeButtonStyle: {
    padding: 15,
    backgroundColor: "purple",
    borderRadius: 5,
  },
  upgradeTextButtonStyle: {
    color: "white",
    fontSize: 15,
  },
  exchange: {
    borderColor: "black", // Цвет рамки
    borderStyle: "solid", // Тип рамки
    borderRadius: 8,
  },
  exchange_button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderColor: "black", // Цвет рамки
    borderStyle: "dashed", // Тип рамки
    borderWidth: 1.5, // Толщина рамки (добавьте, если рамка не отображается)
    borderRadius: 8,
  },
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    marginTop: 100,
  },

  userBlock: {
    marginTop: 49,
    backgroundColor: "#b0b0b0db",
    color: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    paddingVertical: 6,
    width: "100%",
  },
  userInfo: {
    width: 104,
    maxWidth: 104,
    height: "auto",
    maxHeight: 50,
  },

  yourSalmonText: {
    fontSize: 11,
    textAlign: "center",
  },

  scrollUsername: {
    borderTopWidth: 2, // Толщина рамки
    borderTopColor: "#545454db", // Цвет рамки
    borderStyle: "solid", // Тип рамки
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 3,
    marginTop: 5,
  },

  scrollUsernameContentContainer: {
    flexGrow: 1,
    justifyContent: "center", // Центрирование содержимого
    alignItems: "center",
  },

  userName: {
    padding: 4,
    fontSize: 15,
    color: "white",
    flexWrap: "wrap",
  },

  changeSalmon: {
    width: 111,
    padding: 5,
  },

  btnGradientBorder: {
    padding: 2.2, // Отступ для градиентной рамки
    borderRadius: 10, // Радиус для закругления углов рамки
  },
  btn: {
    backgroundColor: "#141414dd", // Черный фон кнопки
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 8, // Радиус для закругления углов самой кнопки
  },
  btnText: {
    fontSize: 15,
    color: "#fff", // Белый цвет текста
    textAlign: "center",
  },
  btnPressed: {
    backgroundColor: "#333", // Темнее при нажатии
  },

  settingsMenu: {
    width: 104,
    alignItems: "flex-end",
  },

  settingsMenuButton: {
    borderRadius: 3,
    width: 80,
    backgroundColor: "#030303",
    paddingVertical: 7,
  },

  settingsMenuText: {
    textAlign: "center",
    color: "white",
  },

  title: {
    color: "red",
    fontSize: 20,
  },
  balanceTitle: {
    color: "blue",
    fontSize: 30,
  },
  mainButtonStyle: {
    padding: 5,
    height: 172,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c7c7c7d2",
    borderRadius: 100,
  },
  mainTextButtonStyle: {
    color: "white",
    fontSize: 18,
  },
  // Главные тап кнопки
  // Серверные кнопки

  shopButton: {
    flexDirection: "row",
    paddingHorizontal: 68,
    paddingVertical: 12,
    backgroundColor: "#ded94be3",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 17,
    marginTop: 60,
    gap: 20,
    marginBottom: 20,

    borderColor: "black", // Цвет рамки
    borderStyle: "dotted", // Тип рамки
    borderWidth: 1.2, // Толщина рамки (добавьте, если рамка не отображается)
    borderRadius: 8,
  },
  chatButton: {
    padding: 10,
    backgroundColor: "#c7c7c7d2",
    borderRadius: 30,
  },
  topButton: {
    padding: 10,
    backgroundColor: "#c7c7c7d2",
    borderRadius: 30,
  },
  battleButton: {
    padding: 10,
    backgroundColor: "#c7c7c7d2",
    borderRadius: 30,
  },

  // Серверные кнопки

  resetText: {
    padding: 6,
    backgroundColor: "#db710ddb",
    color: "black",
    fontSize: 20,
    marginTop: 200,
    marginBottom: 30,
  },
})
