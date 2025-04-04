import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Image, Modal, Animated, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AnimatedNotification from "../components/AnimatedNotification.js";

import { useAppContext } from "../context/context.js"
import { useWebSocketContext } from "../context/websocketcontext.js"


export default function ChatScreen({ navigation, route }) {
  const { chatReceiverId, chatName } = route.params;
  console.log("чат с ", chatReceiverId)

  const [notification, setNotification] = useState("");
  const [notificationTrigger, setNotificationTrigger] = useState(0);

  const { user, userId, checkInternetConnection } = useAppContext()
  const { socket, messages, setMessages } = useWebSocketContext()

  const [chatMessages, setChatMessages] = useState([]);

  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Для управления видимостью меню чата

  const scrollViewRef = useRef()
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [sendingMessage, setSendingMessage] = useState(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [isMessageMenuVisible, setIsMessageMenuVisible] = useState(false); // Видимость меню сообщения



  console.log("chat", user)

  useEffect(() => {
    // Фильтруем сообщения для конкретного чата по chat_id
    const filteredMessages = messages.find(chat => chat.receiver_id === chatReceiverId)?.messages || [];
    setChatMessages(filteredMessages);
    console.log(`сообщения чата с ${chatName}`, filteredMessages);

  }, [messages, chatName]);

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationTrigger((prev) => prev + 1); // Меняем `trigger`, чтобы обновить компонент
  };



  const openMessageMenu = (index) => {
    setSelectedMessageIndex(index);
    setIsMessageMenuVisible(true);
  };

  const closeMessageMenu = () => {
    setSelectedMessageIndex(null);
    setIsMessageMenuVisible(false);
  };

  // Удаление сообщений
  const handleDeleteMessage = () => {
    if (selectedMessageIndex !== null) {
      const message_chat_id = selectedMessageIndex

      const messageInfo = {
        sender_id: userId,
        receiver_id: chatReceiverId,
        message_chat_id,
      };
      socket.emit("deleteMessage", messageInfo);

      socket.on("deletedResult", (message) => {
        const { success } = message;

        if (success) {
          setMessages(prevMessages => {
            return prevMessages.map(chat => {
              if (chat.receiver_id === chatReceiverId) {
                return {
                  ...chat,
                  messages: chat.messages.filter(msg => msg.message_chat_id !== message_chat_id)
                };
              }
              return chat;
            });
          });

          closeMessageMenu();
        }
      });


    }
  };
  // Редактирование сообщений
  const handleEditMessage = () => {
    const messageToEdit = chatMessages.find(msg => msg.message_chat_id === selectedMessageIndex);
    setIsEditingMessage(true)
    setSendingMessage(messageToEdit.content)

    setIsMessageMenuVisible(false);
  };

  const closeEditMessage = () => {
    setIsEditingMessage(false)
    setSendingMessage("")
  };

  // Отправка отредактированного сообщения
  const confirmEditedMessage = () => {
    const messageToEdit = chatMessages.find(msg => msg.message_chat_id === selectedMessageIndex);
    if (messageToEdit && messageToEdit.sender_id === userId) {
      if (messageToEdit.content !== sendingMessage) {

        const message_chat_id = selectedMessageIndex

        const messageInfo = {
          sender_id: userId,
          receiver_id: chatReceiverId,
          message_chat_id,
          editedMessage: sendingMessage,
        };
        socket.emit("editMessage", messageInfo);

        socket.on("editedResult", (message) => {
          const { success } = message;

          if (success) {
            setMessages(prevMessages => {
              return prevMessages.map(chat => {
                if (chat.receiver_id === chatReceiverId) {
                  return {
                    ...chat,
                    messages: chat.messages.map(msg => {
                      if (msg.message_chat_id === message_chat_id) {
                        // Обновляем содержимое найденного сообщения
                        return {
                          ...msg,
                          content: sendingMessage, // новое содержимое сообщения
                        };
                      }
                      return msg; // если не нашли нужное сообщение, оставляем его без изменений
                    })
                  };
                }
                return chat; // если чат не совпадает, оставляем его без изменений
              });
            });

            closeEditMessage()
          }
        });
      } else {
        showNotification("Сообщение никак не изменилось")
      }

    } else {
      showNotification("Вы не автор этого сообщения")
    }
  }



  const sendMessage = async () => {
    if (sendingMessage.length >= 150) {
      showNotification("Сообщение слишком длинное!")
    } else {
      if (checkInternetConnection()) {
        if (socket) {

          const chatIndex = messages.findIndex(chat => chat.receiver_id === chatReceiverId);
          // Генерируем новый ID сообщения
          const newMessageId = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].message_chat_id + 1 : 1;


          const newMessage = {
            message_chat_id: newMessageId,
            content: sendingMessage,
            date: moment().format('DD.MM.YYYY, HH:mm:ss'),
            sender_id: userId,
            receiver_id: chatReceiverId,
            status: "pending", // Пока ожидает отправки
          };

          // Обновляем `messages` с новым сообщением
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];

            if (chatMessages.length !== 0) {
              // Если чат уже существует, добавляем сообщение в существующий чат
              updatedMessages[chatIndex].messages.push(newMessage);
            } else {
              // Если чата нет, создаем новый
              updatedMessages.push({
                receiver_id: chatReceiverId,
                receiver_name: chatName,
                messages: [newMessage]
              });
            }

            return updatedMessages;
          });

          const messageImage = {
            sender_id: userId,
            receiver_id: chatReceiverId,
            sendingMessage,
          };

          console.log("Отправка сообщения:", messageImage);
          socket.emit("sendMessage", messageImage);

          setSendingMessage("")
        }
      } else {
        showNotification("Нет подключения к интернету!")
      }
    }
  }




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
            <TouchableOpacity
              key={index}
              onLongPress={() => openMessageMenu(msg.message_chat_id)}
              activeOpacity={0.8}
              style={[
                styles.message,
                msg.sender_id === userId ? styles.myMessage : styles.otherMessage
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
              <Text style={styles.messageDate}>{moment(msg.date, 'DD.MM.YYYY, HH:mm:ss').format('HH:mm')}</Text>
              {msg.sender_id === userId && (
                <Text style={styles.messageStatus}>
                  {msg.status === "pending" ? (
                    <Ionicons name="navigate-outline" size={16} color="white" />
                  ) : msg.status === "sent" ? (
                    <Ionicons name="checkmark-outline" size={16} color="white" />
                  ) : (
                    <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  )}
                </Text>
              )}

              {/* Меню сообщения */}
              {isMessageMenuVisible && selectedMessageIndex === msg.message_chat_id && (
                <View style={styles.messageMenu}>
                  {msg.sender_id === userId && (
                    <TouchableOpacity onPress={handleEditMessage} style={styles.menuButton}>
                      <Text style={styles.menuButtonText}>Изменить</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleDeleteMessage} style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}

        </ScrollView>

        {/* Ввод сообщения */}
        {isEditingMessage ? (
          <View style={styles.inputContainer}>
            <Pressable onPress={closeEditMessage} style={styles.sendButton}>
              <Ionicons name="close-outline" size={22} color="white" />
            </Pressable>
            <TextInput
              style={styles.input}
              value={sendingMessage}
              onChangeText={setSendingMessage}
              placeholder="Отредактированное сообщение"
              placeholderTextColor="#999"
            />
            {sendingMessage ? (
              <Pressable onPress={confirmEditedMessage} style={styles.sendButton}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color="white" />
              </Pressable>
            ) : (
              <></>
            )}

          </View>
        ) : (
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
        )}

      </View>
    </TouchableWithoutFeedback >
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

  messagesContainer: { height: "100%", padding: 10 },
  message: { maxWidth: "80%", padding: 10, borderRadius: 10, marginVertical: 5 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#444" },
  messageText: { color: "white", fontSize: 16 },
  messageMenu: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#2A2E34',
    borderRadius: 6,
    padding: 6,
    zIndex: 20,
  },
  menuButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  menuButtonText: {
    color: 'white',
    fontSize: 14,
  },

  messageDate: {
    fontSize: 10,
    color: "#fff",
    marginTop: 5,
  },
  messageStatus: {
    fontSize: 10,
    color: "#fff",
    marginTop: 5,
    textAlign: "right", // Выравнивание по правому краю для отправленных сообщений
  },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#333" },
  input: { flex: 1, color: "white", padding: 10, borderRadius: 5, backgroundColor: "#444" },
  sendButton: { padding: 10 },
});
