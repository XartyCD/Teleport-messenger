import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Image, Modal, Animated, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ChatScreen({ navigation, route }) {
  const { chatName } = route.params;

  const [backgroundImage, setBackgroundImage] = useState(null);

  const [isMenuVisible, setIsMenuVisible] = useState(false); // Для управления видимостью меню

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const hideMenu = () => {
    setIsMenuVisible(false);
  };


  const pickImage = async () => { // Кастомная смена обоев
    try {
      // Запрашиваем разрешение на доступ к фото
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access the media library is required!');
        return;
      }

      // Запускаем выбор изображения
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType, // Обратите внимание на MediaTypeOptions
        allowsEditing: true,
        aspect: [3, 4],  // Масштаб кропа
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri;
        setBackgroundImage(selectedImageUri);

        // Сохраняем выбранное изображение в AsyncStorage
        await AsyncStorage.setItem(`backgroundImage_${chatName}`, selectedImageUri);
      }
    } catch (error) {
      console.error("Ошибка при выборе изображения:", error);
    }
    hideMenu() // скрытие меню действий
  };

  const resetBackgroundImage = async () => {    // Сброс фона на стандартный серый цвет
    setBackgroundImage(null);
    await AsyncStorage.removeItem(`backgroundImage_${chatName}`); // Удаляем сохраненное изображение

    hideMenu()
  };

  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        const storedImageUri = await AsyncStorage.getItem(`backgroundImage_${chatName}`);
        if (storedImageUri) {
          setBackgroundImage(storedImageUri);
        }
      } catch (error) {
        console.error("Ошибка при загрузке фона:", error);
      }
    };

    loadBackgroundImage();
  }, [chatName]);


  return (
    <TouchableWithoutFeedback onPress={hideMenu}>
      <View style={[styles.container, { backgroundColor: backgroundImage ? "transparent" : "#1e1e1e" }]}>
        {backgroundImage && (
          <Image source={{ uri: backgroundImage }} style={styles.backgroundImage} />
        )}
        <View style={styles.topPanel}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </Pressable>
          <Text style={styles.chatName}>{chatName}</Text>
          <Pressable onPress={toggleMenu}>
            <Ionicons name="ellipsis-vertical" size={26} color="white" />
          </Pressable>
        </View>

        {/* Модальное меню */}
        {isMenuVisible && (

          <TouchableWithoutFeedback onPress={hideMenu}>
            <View style={styles.menuContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.menu}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => console.log("Поиск")}>
                    <Ionicons name="search-outline" size={20} color="white" />
                    <Text style={styles.menuItemText}>Поиск</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
                    <Ionicons name="images-outline" size={20} color="white" />
                    <Text style={styles.menuItemText}>Сменить обои</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={resetBackgroundImage}>
                    <Ionicons name="refresh-outline" size={20} color="white" />
                    <Text style={styles.menuItemText}>Сбросить обои</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => console.log("Очистить чат")}>
                    <Ionicons name="warning-outline" size={20} color="white" />
                    <Text style={styles.menuItemText}>Очистить чат</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => console.log("Заблокировать")}>
                    <Ionicons name="hand-left-outline" size={20} color="white" />
                    <Text style={styles.menuItemText}>Заблокировать</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        )}

        <View style={styles.chatWrapper}>
          <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            Здесь будут сообщения с {chatName}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e1e1e" },
  topPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#222",
    padding: 15,
  },
  chatName: { color: "white", fontSize: 18, fontWeight: "bold" },
  chatWrapper: { flex: 1, padding: 20 },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Заставляем картинку занять весь экран
    width: "100%",
    height: "100%",
    resizeMode: "cover", // Картинка будет покрывать весь экран
  },
  menuContainer: {
    position: "absolute",
    top: 57,
    right: 10,
    zIndex: 10,
  },
  menu: {
    backgroundColor: "#2A2E34",
    borderRadius: 6,
    padding: 8,
    elevation: 10, // тень для визуала
  },
  menuItem: {
    flexDirection: "row",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
  },
});
