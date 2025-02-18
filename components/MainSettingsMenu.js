import React, { useEffect, useRef } from "react";
import { Text, Animated, StyleSheet, Dimensions, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window");

import { useAppContext } from "../context/context.js"

export default MainSettingsMenu = ({ isVisible, toggleSettingsMenu }) => {
  const { user, setUser, setSessionId, checkInternetConnection, CONNECTURL } = useAppContext()
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация для меню
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : -width,
      duration: 260,
      useNativeDriver: true,
    }).start();

    // Анимация для фона
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Функция для закрытия меню при клике на фон
  const handleBackgroundPress = () => {
    toggleSettingsMenu(false); // Закрытие меню при клике на фон
  };


  const leaveAccount = async () => {
    const connected = await checkInternetConnection()
    if (connected) {
      try {
        const response = await fetch(`${CONNECTURL}/leave-account`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user }),
        })

        const data = await response.json()
        if (data.success) {

          // Сбрасываем состояния
          setUser(null)
          setSessionId(null)

          // Удаляем данные из AsyncStorage
          await AsyncStorage.clear()

          alert("Вы успешно вышли!")
        } else {
          alert("Ошибка выхода!")
        }
      } catch (e) {
        console.error("Ошибка выхода", e)
      }
    } else {
      alert("Нет подключения к интернету!")
    }
  }

  return (
    <Animated.View style={[styles.menuBackground, { opacity }]}>
      {/* Фон, при клике на который меню будет закрываться */}

      <Pressable style={styles.overlay} onPress={handleBackgroundPress} />

      {/* Меню */}
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX }] }]}>
        <View style={styles.listItems}>
          <Pressable style={styles.menuItem} onPress={() => console.log("Меню пункт 1")}>
            <Ionicons name="wallet-outline" size={24} color="white" />
            <Text style={styles.menuItemText}>Профиль</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => console.log("Меню пункт 2")}>
            <Ionicons name="settings-outline" size={24} color="white" />
            <Text style={styles.menuItemText}>Настройки</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => leaveAccount()}>
            <Ionicons name="warning-outline" size={24} color="white" />
            <Text style={styles.menuItemText}>Выйти из профиля</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    width: width,
    height: height,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Полупрозрачный черный фон
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: width * 0.7, // Меню будет занимать 70% ширины экрана
    height: height,
    backgroundColor: "#222",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  listItems: {
    display: "flex",
    flexDirection: "column",
    marginTop: 20,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    color: "white",
  },
  menuItemText: {
    fontSize: 16,
    color: "white",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
  },
});
