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
  Alert,
  Animated,
} from "react-native"
import React, { useState, useEffect, useRef } from "react"
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image";

import { useAppContext } from "../context/context.js"

import MainSettingsMenu from "../components/MainSettingsMenu.js";

export default MainChatScreen = ({ navigation }) => {
  const NoChatsGifsArray = [require("../assets/gifs/noChatsGif-v1.gif"),
  require("../assets/gifs/noChatsGif-v2.gif"),
  require("../assets/gifs/noChatsGif-v3.gif")
  ]
  const [noChatsGif, setNoChatsGif] = useState(null);
  const noChatsGifRef = useRef(null); // useRef для GIF

  const { getAllDataFromAsyncStorage, user, setUser, setSessionId, checkInternetConnection, userChats, setUserChats, CONNECTURL } = useAppContext()

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleSettingsMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  getAllDataFromAsyncStorage()

  useEffect(() => {
    // Если нет чатов, установим GIF
    if (userChats.length === 0 && !noChatsGifRef.current) {
      const randomGif = NoChatsGifsArray[Math.floor(Math.random() * NoChatsGifsArray.length)];
      setNoChatsGif(randomGif);
      noChatsGifRef.current = randomGif; // Сохраняем текущий GIF в ref
    }
  }, [userChats]);



  return (
    <View style={styles.container}>
      {/* Передаем состояние isVisible в компонент меню */}
      {isMenuOpen ? (<MainSettingsMenu isVisible={isMenuOpen} toggleSettingsMenu={toggleSettingsMenu} />) : <></>}


      <View style={styles.navBlock}>
        {/* Кнопка для открытия/закрытия меню */}
        <Pressable style={styles.menuButton} onPress={toggleSettingsMenu}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color="white" />
        </Pressable>

        <Pressable style={styles.searchButton} onPress={() => console.log(2)}>
          <Ionicons name={"search"} size={30} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.mainWrapper}>
        {userChats.length > 0 ? (
          userChats.map((chat) => (
            <Pressable key={chat.id} style={styles.chatItem} onPress={() => navigation.navigate("ChatScreen", { chatId: chat.id, chatName: chat.name })}>
              <View style={styles.chatAvatar}>
                <Text style={styles.avatarText}>{chat.name[0]}</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.lastMessage}>{chat.lastMessage}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.noChatsContainer}>
            <Image
              source={noChatsGif}
              style={styles.gif}
              contentFit="contain"
            />
            <Text style={styles.noChatsText}>У вас нет активных чатов</Text>
            <View style={styles.btnGoConnect}>
              <LinearGradient
                colors={["rgb(0, 70, 131)", "rgb(100, 21, 179)"]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.btnGradientBorder}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    pressed && styles.btnPressed
                  ]}
                  onPress={() => startTimer("схемы")}
                >
                  <Text style={styles.btnText}>Начать общение</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#20232A",
  },
  navBlock: {
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    height: 62,
    borderBottomWidth: 0.5, // Толщина границы
    borderBottomColor: "#000", // Цвет границы
  },
  menuButton: {
    padding: 10,
    zIndex: 9999,
  },
  searchButton: {
    padding: 10,
  },
  noChatsContainer: {
    marginTop: "19%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  gif: {
    width: 200,
    height: 200,

  },
  noChatsText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },

  btnGoConnect: {
    padding: 5,
  },
  btnGradientBorder: {
    padding: 1.2,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "#ccdce81e",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  btnText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  btnPressed: {
    backgroundColor: "#333",
  },


  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#2c2c2e", // Темный фон (примерно как в iOS Dark Mode)

    borderWidth: 1,
    borderColor: "#3a3a3c", // Чуть более светлый серый для контура
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#444", // Темно-серый фон для аватара
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ddd", // Светло-серый текст в аватаре
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f5f5f5", // Почти белый текст
  },
  lastMessage: {
    fontSize: 14,
    color: "#a0a0a0", // Серый текст для последнего сообщения
  },
});
