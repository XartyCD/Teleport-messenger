import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Image, Modal, Animated, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AnimatedNotification from "../components/AnimatedNotification.js";

import { useAppContext } from "../context/context.js"
import { useWebSocketContext } from "../context/websocketcontext.js"


export default function ChatScreen({ navigation, route }) {
  const { chatId, chatName } = route.params;

  const [notification, setNotification] = useState("");
  const [notificationTrigger, setNotificationTrigger] = useState(0);

  const { user, userId, checkInternetConnection } = useAppContext()
  const { socket, messages } = useWebSocketContext()

  const [chatMessages, setChatMessages] = useState([]);

  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Для управления видимостью меню

  const scrollViewRef = useRef()
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [sendingMessage, setSendingMessage] = useState(null);


  console.log("chat", user)

  useEffect(() => {
    // Фильтруем сообщения для конкретного чата по chat_id
    const filteredMessages = messages.find(chat => chat.chat_id === chatId)?.messages || [];
    setChatMessages(filteredMessages);
    console.log('chat', filteredMessages);

  }, [messages, chatName]);

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationTrigger((prev) => prev + 1); // Меняем `trigger`, чтобы обновить компонент
  };


  const sendMessage = async () => {
    if (sendingMessage.length >= 150) {
      showNotification("Сообщение слишком длинное!")
    } else {
      if (checkInternetConnection()) {
        if (socket) {
          if (chatMessages.length !== 0) {  // если чат уже есть
            const messageImage = {
              chatId,
              sender_id: userId,
              sendingMessage,
            };

            console.log("Отправка сообщения:", messageImage);
            socket.emit("sendMessage", messageImage);
          } else { // если отправляемое сообщение первое и чата раньше небыло
            const messageImage = {
              sender: userId,
              sendingMessage,
              receiver: chatName
            };

            console.log("Отправка первого сообщения:", messageImage);
            socket.emit("sendFirstMessage", messageImage);
          }
          setSendingMessage("")
        }
      } else {
        showNotification("Нет подключения к интернету!")
      }
    }
  }


  // Функция для проверки, находится ли ScrollView внизу
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40; // 40 - допустимое отклонение для учета некоторых погрешностей
    setIsAtBottom(isAtBottom);
  }, []);


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
        {notification && (<AnimatedNotification message={notification} trigger={notificationTrigger} />)}
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

        <ScrollView ref={scrollViewRef} style={styles.messagesContainer}>
          {chatMessages.map((msg, index) => (
            <View key={index} style={[styles.message, msg.sender_id === userId ? styles.myMessage : styles.otherMessage]}>
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Ввод сообщения */}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={sendingMessage}
            onChangeText={setSendingMessage}
            placeholder="Введите сообщение..."
            placeholderTextColor="#999"
          />
          {sendingMessage ? (
            <Pressable onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={22} color="white" />
            </Pressable>
          ) : (
            <></>
          )}

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

  messagesContainer: { flex: 1, padding: 10 },
  message: { maxWidth: "80%", padding: 10, borderRadius: 10, marginVertical: 5 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#444" },
  messageText: { color: "white" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#333" },
  input: { flex: 1, color: "white", padding: 10, borderRadius: 5, backgroundColor: "#444" },
  sendButton: { padding: 10 },
});
