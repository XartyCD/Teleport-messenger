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
import { useNavigation } from "@react-navigation/native";

import { useAppContext } from "../context/context.js"


export default SearchScreen = ({ isVisible, toggleSearchPage }) => {
  const NoChatsGifsArray = [require("../assets/gifs/noChatsGif-v1.gif"),
  require("../assets/gifs/noChatsGif-v2.gif"),
  require("../assets/gifs/noChatsGif-v3.gif")
  ]

  const navigation = useNavigation();
  const [noChatsGif, setNoChatsGif] = useState(null);
  const noChatsGifRef = useRef(null); // useRef для GIF

  const { getAllDataFromAsyncStorage, checkInternetConnection, socket, userId, userChats, CONNECTURL } = useAppContext()

  const [users, setUsers] = useState("");
  const [searchText, setSearchText] = useState("");

  const hasRendered = useRef(false); // Хук для проверки первого рендера


  const handleClose = () => {
    toggleSearchPage(); // Закрытие поиска
  };

  useEffect(() => {
    // Выполняем запрос только если еще не делали его (при первом открытии)
    if (!hasRendered.current) {
      const fetchUsers = () => {
        socket.emit("getAllUsers", userId); // Отправляем запрос на сервер, чтобы получить всех пользователей
      };

      // Слушаем события WebSocket
      socket.on("allUsers", (data) => {
        setUsers(data); // Когда получаем пользователей, сохраняем их в состоянии
      });

      // Запрашиваем пользователей при первом рендере
      fetchUsers();
      hasRendered.current = true; // Устанавливаем флаг, чтобы больше не запрашивать данные

      return () => {
        socket.off("allUsers"); // Очистка события, если компонент будет размонтирован
      };
    }
  }, []);





  return (
    <View style={styles.container}>
      <View style={styles.navBlock}>
        <Pressable onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </Pressable>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Имя пользователя"
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView style={styles.mainWrapper}>
        {searchText ? (
          users.length > 0 ? ( // Проверка прогрузки
            // Фильтр имя начинается с searchText ?
            users
              .filter((people) =>
                people.user.toLowerCase().startsWith(searchText.toLowerCase()) // Поиск только по первым буквам
              )
              .length > 0 ? (
              // Если есть результаты
              users
                .filter((people) =>
                  people.user.toLowerCase().startsWith(searchText.toLowerCase())
                )
                .map((people) => (
                  <Pressable key={people.id} style={styles.chatItem} onPress={() => navigation.navigate("ChatScreen", { chatName: people.user })}>
                    <View style={styles.chatAvatar}>
                      <Text style={styles.avatarText}>{people.user[0]}</Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatMainInfo}>
                        <Text style={styles.chatName}>{people.user}</Text>
                      </View>
                      <View style={styles.chatOptionalInfo}>
                        <Ionicons name={"enter-outline"} size={30} color="white" />
                      </View>
                    </View>
                  </Pressable>
                ))
            ) : (
              // Если нет совпадений
              <View style={styles.noChatsContainer}>
                <Text style={styles.noChatsText}>Никого не найдено :(</Text>
                <Image source={noChatsGif} style={styles.gif} contentFit="contain" />
              </View>
            )
          ) : (
            // Если ждем данных (users пуст)
            <View style={styles.noChatsContainer}>
              <Text style={styles.noChatsText}>Загрузка пользователей...</Text>
            </View>
          )
        ) : (
          // Когда searchText пусто
          <View style={styles.noChatsContainer}>
            <Text style={styles.noChatsText}>Просто начните вводить...</Text>
            <Image source={noChatsGif} style={styles.gif} contentFit="contain" />
          </View>
        )}
      </ScrollView>


    </View >
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
    gap: 16,
    paddingHorizontal: 9,
    height: 62,
    borderBottomWidth: 0.5, // Толщина границы
    borderBottomColor: "#000", // Цвет границы
  },
  noChatsContainer: {
    marginTop: "10%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  gif: {
    width: 100,
    height: 100,
  },
  noChatsText: {
    fontSize: 18,
    color: '#bfbfbf',
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
  input: { flex: 1, color: "white", padding: 6, fontSize: 15, borderBottomColor: "#4d5154", borderBottomWidth: 2 },


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
    flexDirection: 'row', // Горизонтальное расположение для основного и дополнительного блока
    justifyContent: 'space-between', // Расстояние между элементами (чтобы элементы были на разных концах)
    flex: 1,  // Для того чтобы блок занимал все доступное пространство
    marginLeft: 3,
  },
  chatMainInfo: {
    flex: 1,  // Основная информация занимает весь оставшийся пространство
  },
  chatName: {
    fontWeight: 'bold',
    color: "white",
    fontSize: 16,
  },
  chatOptionalInfo: {
    alignItems: 'flex-end',  // Элементы выравниваем по правому краю
  },
});
