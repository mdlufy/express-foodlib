const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

require('dotenv').config();

axios.defaults.timeout = 5000;
axios.defaults.baseURL = "http://localhost:3005";

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

let currentPictures = [];
const startMessage = `Commands:

/get_pictures [category] - show picture
/save_pictures [1-4] - save picture to favourites
/saved_pictures - show saved pictures
/export - export pictures
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
            user.savedPictures = [];
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

// Matches "/get_pictures"
bot.onText(/\/get_pictures\s+\w+/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    
    match = String(match).split(/\s+/)

    const pictureCategory = match[1];

    currentPictures = [];

    axios("/api/get_pictures", { params: { sid: getUUIDByUsername(username), category: pictureCategory } })
        .then((response) => {
            const pictures = response.data;

            for (const picture of pictures) {
                bot.sendPhoto(chatId, picture);
                currentPictures.push(picture);
            }
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through the site");
                return
            }

            bot.sendMessage(chatId, "Failed to get Pictures");
        });
});

// Matches "/save_pictures [1-4]"
bot.onText(/\/save_pictures\s+([1-9]+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pictureImgIdx = parseInt(match[1]);
    const username = msg.from.username;

    if (pictureImgIdx < 1 || pictureImgIdx > 4) {
        bot.sendMessage(chatId, "Index should be 1-4");
        return;
    }

    const picture = currentPictures[pictureImgIdx - 1];

    if (!picture) {
        bot.sendMessage(chatId, "First get Pictures through /get_pictures");
        return;
    }

    axios
        .post("/api/save_pictures", {
            pictureUrl: picture,
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

// Matches "/saved_pictures"
bot.onText(/\/saved_pictures/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    axios("/api/saved_pictures", { params: { sid: getUUIDByUsername(username) } })
        .then((response) => {
            const pictures = response.data;

            if (!pictures.length) {
                bot.sendMessage(chatId, "You don't have picture yet");
                return;
            }

            for (const picture of pictures) {
                bot.sendPhoto(chatId, picture);
            }
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through site");
                return
            }

            bot.sendMessage(chatId, "Failed to get Pictures");
        });
});

// Mathes "/export"
bot.onText(/\/export/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    axios("/api/saved_pictures", { params: { sid: getUUIDByUsername(username) } })
        .then((response) => {
            const pictures = response.data;
            const jsonPictures = JSON.stringify(pictures)

            bot.sendDocument(chatId, Buffer.from(jsonPictures), {}, {
                filename: 'pictures.json',
                contentType: 'application/json'
            })
        })
        .catch((err) => {
            if (err.status === 'unauth') {
                bot.sendMessage(chatId, "First log in through site");
                return
            }

            bot.sendMessage(chatId, "Failed to get Pictures");
        });
})