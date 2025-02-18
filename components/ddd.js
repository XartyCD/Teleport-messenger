import React, { useEffect, useRef } from "react";
import { Text, Animated, StyleSheet, Dimensions, Pressable, TouchableWithoutFeedback, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default MainSettingsMenu = ({ isVisible, toggleSettingsMenu }) => {
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация для меню
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Анимация для фона
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Функция для закрытия меню при клике на фон
  const handleBackgroundPress = () => {
    toggleSettingsMenu(false); // Закрытие меню при клике на фон
  };

  return (
    <Animated.View style={[styles.menuBackground, { opacity }]}>

      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

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
    marginTop: 20
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    color: "white"
  },
  menuItemText: {
    fontSize: 16,
    color: "white"
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
  },
});
