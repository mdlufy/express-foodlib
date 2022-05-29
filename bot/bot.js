const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

require('dotenv').config();

axios.defaults.timeout = 5000;
axios.defaults.baseURL = "http://localhost:3005";

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

let currentWaifus = [];
const startMessage = `Commands:

/get_waifus - show waifus
/save_waifus [1-4] - save waifus to favourites
/saved_waifus - show saved waifus
/export - export waifus
`;

function getUUIDByUsername(username) {
    const users = JSON.parse(fs.readFileSync("../users.json", "utf8"));
    const user = users.find((user) => user.username === username);
    console.log(user)
    console.log(user && user.sid)

    return user && user.sid;
}

// Matches "/start"
bot.onText(/\/start\s?([0-9a-f-]{36})?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const uuid = match[1];

    if (uuid) {
        const users = JSON.parse(fs.readFileSync("../users.json", "utf8"));
        const sessions = JSON.parse(fs.readFileSync("../sessions.json", "utf8"));
        const session = sessions.find((session) => session === uuid);
        const username = msg.from.username;
        let user = users.find((user) => user.username === username);

        console.log(sessions, "sessions");

        if (!session) return;

        console.log(session, "session");

        if (!user) {
            user = {};
            user.username = username;
            user.savedWaifus = [];
            users.push(user);
        }

        user.expire = Date.now() + 1000 * 60 * 60 * 48;
        user.sid = uuid;

        console.log(user);

        fs.writeFileSync("../users.json", JSON.stringify(users));

        bot.sendMessage(chatId, "https://localhost:3005");
    } else {
        bot.sendMessage(chatId, startMessage);
    }
});

// Matches "/get_waifus"
bot.onText(/\/get_waifus/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    currentWaifus = [];

    await axios("/api/get_waifus", { params: { sid: getUUIDByUsername(username) } })
        .then((response) => {
            const waifus = response.data;

            for (const waifu of waifus) {
                bot.sendPhoto(chatId, waifu);
                currentWaifus.push(waifu);
            }
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through the site");
                return
            }

            bot.sendMessage(chatId, "Failed to get waifus");
        });
});

// Matches "/save_waifu [1-4]"
bot.onText(/\/save_waifus\s+([1-9]+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const waifuImgIdx = parseInt(match[1]);
    const username = msg.from.username;

    if (waifuImgIdx < 1 || waifuImgIdx > 4) {
        bot.sendMessage(chatId, "Index should be 1-4");
        return;
    }

    const waifu = currentWaifus[waifuImgIdx - 1];

    if (!waifu) {
        bot.sendMessage(chatId, "First get waifus through /get_waifus");
        return;
    }

    axios
        .post("/api/save_waifus", {
            waifuUrl: waifu,
            sid: getUUIDByUsername(username)
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through the site");
                return
            }

            bot.sendMessage(chatId, "Failed to save picture");
        });
});

// Matches "/saved_waifus"
bot.onText(/\/saved_waifus/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    axios("/api/saved_waifus", { params: { sid: getUUIDByUsername(username) } })
        .then((response) => {
            const waifus = response.data;

            if (!waifus.length) {
                bot.sendMessage(chatId, "You don't have waifu yet");
                return;
            }

            for (const waifu of waifus) {
                bot.sendPhoto(chatId, waifu);
            }
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through site");
                return
            }

            bot.sendMessage(chatId, "Failed to get waifus");
        });
});

// Mathes "/export"
bot.onText(/\/export/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    axios("/api/saved_waifus", { params: { sid: getUUIDByUsername(username) } })
        .then((response) => {
            const waifus = response.data;
            const jsonWaifus = JSON.stringify(waifus)

            bot.sendDocument(chatId, Buffer.from(jsonWaifus), {}, {
                filename: 'waifus.json',
                contentType: 'application/json'
            })
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through site");
                return
            }

            bot.sendMessage(chatId, "Failed to get waifus");
        });
})