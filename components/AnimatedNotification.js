import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";

const AnimatedNotification = ({ message, trigger }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;
  const timeoutRef = useRef(null); // Для контроля таймера

  useEffect(() => {
    if (message) {
      // Сброс анимаций при изменении сообщения
      fadeAnim.setValue(0);
      translateYAnim.setValue(-50);

      // Запуск анимации появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Очистка старого таймера, если сообщение обновилось
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Запуск таймера для скрытия уведомления через 3 секунды
      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -50,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 3000);
    }
  }, [message, trigger]); // добавление trigger для пересоздания анимации

  return (
    <Animated.View
      style={[
        styles.warningContainer,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
      ]}
    >
      <Text style={styles.warnSetNickname}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  warningContainer: {
    position: "absolute",
    top: 30,
    left: 20,
    right: 20,
    padding: 8,
    backgroundColor: "rgba(255, 0, 0, 0.5)",
    borderRadius: 10,
    alignItems: "center",
    zIndex: 9999
  },
  warnSetNickname: {
    color: "white",
    fontSize: 18,
    fontFamily: "Merienda-VariableFont_wght",
  },
});

export default AnimatedNotification;
