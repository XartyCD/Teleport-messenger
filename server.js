const express = require("express")
const mysql = require("mysql")

const http = require("http")
const socketIo = require("socket.io")

const app = express()
const port = 9000
const socketPort = 9003

const server = http.createServer(app)

// Настраиваем Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // Обеспечиваем доступ с любых источников, важно для работы с клиентом
  },
})

const pool = mysql.createPool({

  connectionLimit: 100, // Устанавливаем лимит соединений ;
  host: "localhost",
  user: "root",
  password: "",
  database: "TeleportBase",
})

// app.use(express.static(path.join(__dirname, 'public')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*") // Разрешить любые источники
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS") // Разрешить методы
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  ) // Указать заголовки
  next()
})

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.stack)
    return
  }
  console.log("Подключено к базе данных как id " + connection.threadId)

  // Освобождаем соединение после успешного подключения
  connection.release()
})

app.get("/api/getrealtime", (req, res) => {
  const currentTime = Date.now()

  // Возвращаем текущее время
  res.status(200).json({ realTime: currentTime })
})

// API РЕГИСТРАЦИИ И АВТОРИЗАЦИИ

app.post("/api/checkusers", (req, res) => {
  const { checkedNewName } = req.body
  const query = "SELECT COUNT(*) AS count FROM users WHERE user =?"
  pool.query(query, [checkedNewName], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ success: false })
      return
    }

    if (results[0].count > 0) {
      const checkSessionId =
        "SELECT sessionId FROM users WHERE user = ?"
      pool.query(checkSessionId, [checkedNewName], (error, results, fields) => {
        if (error) {
          console.error("Ошибка при смене статуса sessionId", error)
          res.status(500).json({
            success: false,
            message: "Ошибка при смене статуса sessionId",
          })
          return
        }

        if (results[0].sessionId === "0") {
          res.status(400).json({ success: "Ожидание ключа" }) // Пропуск как при обычной авторизации

        } else {
          res.status(200).json({ success: "already user" }) // Пропуск как при забытии аккаунта
        }
      })
    } else {
      res.status(200).json({ success: true })
    }
  })
})

app.post("/api/register", (req, res) => {
  const { checkedNewName, secretKey, sessionId } = req.body;

  const query = "SELECT COUNT(*) AS count FROM users WHERE user = ?";
  pool.query(query, [checkedNewName], (error, results) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error);
      return res.status(500).json({ success: false });
    }

    if (results[0].count > 0) {
      return res.status(400).json({ success: false, message: "Пользователь уже существует" });
    }

    const getCurrentTimeFormatted = () =>
      new Date().toISOString().replace("T", " ").slice(0, 19);
    const currentTime = getCurrentTimeFormatted();

    const getMaxIdQuery = "SELECT MAX(id) AS maxId FROM users";
    pool.query(getMaxIdQuery, (error, results) => {
      if (error) {
        console.error("Ошибка при получении max(id):", error);
        return res.status(500).json({ success: false, message: "Ошибка при получении ID" });
      }

      const newId = (results[0].maxId || 0) + 1; // Если таблица пуста, id = 1

      const insertQuery = "INSERT INTO users (id, user, password, sessionId, regTime) VALUES (?, ?, ?, ?, ?)";
      pool.query(insertQuery, [newId, checkedNewName, secretKey, sessionId, currentTime], (error) => {
        if (error) {
          console.error("Ошибка при добавлении пользователя:", error);
          return res.status(500).json({ success: false, message: "Ошибка при записи пользователя" });
        }
        res.status(201).json({ success: true, id: newId, message: "Пользователь зарегистрирован" });
      });
    });
  });
});


app.post("/api/confirmsecretkey", (req, res) => {
  const { username, key, sessionId } = req.body
  const query = "SELECT password, sessionId FROM users WHERE BINARY user = ?"

  pool.query(query, [username], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ message: "Произошла ошибка при аутентификации" })
      return
    }

    if (results.length === 1) {

      if (key === results[0].secretKey) {
        if (results[0].sessionId === "0") {
          const updateSessionId =
            "UPDATE users SET sessionId = ? WHERE user = ?"
          pool.query(updateSessionId, [sessionId, username], (error, results, fields) => {
            if (error) {
              console.error("Ошибка при смене статуса sessionId", error)
              res.status(500).json({
                success: false,
                message: "Ошибка при смене статуса sessionId",
              })
              return
            }
          })
          res.status(200).json({ message: "Успешная авторизация", success: true })

        } else if (results[0].sessionId === sessionId) {
          res.status(200).json({ message: "Перегенерировать сессию", success: true })

        } else {
          res.status(200).json({ message: "Аккаунт уже используется", success: true })
        }
      } else {
        res.status(200).json({ message: "Неверный ключ", success: true })
      }
    } else {
      res.status(200).json({ message: "Пользователь не найден" })
    }
  })
})

// FIX
app.post("/api/firstdataload", (req, res) => {
  const { user } = req.body

  // Запрос для получения всех сообщений, сортированных по времени
  const query = "SELECT * FROM userRating WHERE user = ?"

  pool.query(query, [user], (error, results) => {
    if (error) {
      console.error(
        "Ошибка при выполнении загрузки данных из дб:",
        error
      )
      res
        .status(500)
        .json({ success: false, message: "Ошибка при получении первичных данных из дб" })
      return
    }

    // Возвращаем список рейтинга
    res.status(200).json({ success: true, date: results })
  })
})

// API РЕГИСТРАЦИИ И АВТОРИЗАЦИИ

// ВЫЙТИ ИЗ АККАУНТА

app.post("/api/leave-account", (req, res) => {
  const { user, balance, countTap } = req.body

  const saveDataQuery = "UPDATE userRating SET balance = ?, countTap = ? WHERE user = ?"

  pool.query(saveDataQuery, [balance, countTap, user], (error, results) => {
    if (error) {
      console.error("Ошибка при обновлении польз данных:", error)
      res.status(500).json({ success: false, message: "Ошибка при обновлении данных польз" })
      return
    }

    // Заменить sessionId на 0
    const leaveQuery = `UPDATE regUsers SET sessionId = 0 WHERE user = ?`

    pool.query(leaveQuery, [user], (error, results) => {
      if (error) {
        console.error("Ошибка при замене sessionId при выходе:", error)
        res.status(500).json({ success: false, message: "Ошибка выхода" })
        return
      }

      res.status(200).json({ success: true, message: "Успешный выход и сохранение данных в базе" })
    })
  }
  )
})

// API УДАЛЕНИЕ АККАУНТА

app.delete("/api/delete-account", (req, res) => {
  const { user } = req.body

  // Удалить пользователя
  const deleteUserReg = "DELETE FROM regUsers WHERE user = ?"
  pool.query(deleteUserReg, [user], (error, results) => {
    if (error) {
      console.error("Ошибка при удалении userReg:", error)
      res.status(500).json({ success: false, message: "Ошибка при userReg" })
      return
    }
    res.status(200).json({ success: true, message: "Пользователь удален." })
  })
})

// API УДАЛЕНИЕ АККАУНТА



//API ПРОВЕРКИ ЧТО УНИКАЛЬНЫЙ ID ВСЕ ЕЩЕ В БАЗЕ (ДЛЯ АВТОРИЗОВАННЫХ)

app.post("/api/checksessionid", (req, res) => {
  const { username, sessionId } = req.body
  const query = "SELECT sessionId FROM regUsers WHERE user = ?"
  pool.query(query, [username], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ success: false })
      return
    }

    if (results[0].sessionId != sessionId) {
      res.status(400).json({ message: "Сессия недействительна" })
    } else {
      res.status(200).json({ success: true })
    }
  })
})

//API ПРОВЕРКИ ЧТО УНИКАЛЬНЫЙ ID ВСЕ ЕЩЕ В БАЗЕ (ДЛЯ АВТОРИЗОВАННЫХ)


// API ДЛЯ ВЫБРОСА ИЗ АККАУНТА

app.post("/api/forgotaccount", (req, res) => {
  const { username, key, sessionId } = req.body
  const query = "SELECT secretKey FROM regUsers WHERE user = ?"

  pool.query(query, [username], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ message: "Произошла ошибка при аутентификации" })
      return
    }

    if (results.length === 1) {

      if (key === results[0].secretKey) {
        const updateSessionId = "UPDATE regUsers SET sessionId = ? WHERE user = ?"
        pool.query(updateSessionId, [sessionId, username], (error, results, fields) => {
          if (error) {
            console.error("Ошибка при смене sessionId", error)
            res.status(500).json({
              success: false,
              message: "Ошибка при смене sessionId",
            })
            return
          }
        })
        res.status(200).json({ message: "Успешное восстановление", success: true })
      } else {
        res.status(200).json({ message: "Неверный ключ", success: true })
      }
    } else {
      res.status(200).json({ message: "Пользователь не найден" })
    }
  })
})

// API ДЛЯ ВЫБРОСА ИЗ АККАУНТА


// API РЕЙТИНГА


// API РЕЙТИНГА

// API ЧАТА



// API ЧАТА


// Маршрут для получения списка игр
app.get("/api/getlistgames", (req, res) => {
  const query = "SELECT * FROM poolPongGame ORDER BY time ASC;"

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Ошибка при получении игр:", error)
      res
        .status(500)
        .json({ success: false, message: "Ошибка при получении игр" })
      return
    }

    res.status(200).json({ success: true, ponggames: results })
  })
})

app.get("/api/checkappinfo", (req, res) => {
  // Запрос для получения всех сообщений, сортированных по времени
  const query = "SELECT version FROM actualInfoApp"

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Ошибка при полчении инфо о приложении:", error)
      res.status(500).json({
        success: false,
        message: "Ошибка при получении данных о приложении",
      })
      return
    }

    // Возвращаем список сообщений
    res.status(200).json({ success: true, info: results })
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер успешно запущен на порту ${port}`)
})

server.listen(socketPort, "0.0.0.0", () => {
  console.log(`Сокеты запущены на порту ${socketPort}`)
})