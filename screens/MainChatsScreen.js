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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"
import { useAppContext } from "../context/context.js"

import MainSettingsMenu from "../components/MainSettingsMenu.js";

export default MainChatScreen = () => {
  const { getAllDataFromAsyncStorage, user, setUser, setSessionId, checkInternetConnection, CONNECTURL } = useAppContext()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleSettingsMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  getAllDataFromAsyncStorage()



  return (
    <View style={styles.container}>
      {/* Передаем состояние isVisible в компонент меню */}
      {isMenuOpen ? (<MainSettingsMenu isVisible={isMenuOpen} toggleSettingsMenu={toggleSettingsMenu} />) : <></>}


      <View style={styles.navBlock}>
        {/* Кнопка для открытия/закрытия меню */}
        <Pressable style={styles.menuButton} onPress={toggleSettingsMenu}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.mainWrapper}>


        <Pressable style={styles.resetButton} onPress={() => console.log("Button Pressed")}>
          <Text style={styles.resetText}>Сбросить прогресс</Text>
        </Pressable>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "orange",
  },
  navBlock: {
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    height: 80,
  },
  menuButton: {
    padding: 10,
    zIndex: 9999,
  },
  mainWrapper: {
    padding: 20,
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: "#db710ddb",
    padding: 10,
    borderRadius: 8,
  },
  resetText: {
    color: "black",
    fontSize: 18,
  },
});
