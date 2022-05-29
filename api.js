const express = require('express');
const axios = require('axios');
const fs = require('fs')
const router = express.Router();

const waifuApiUrl = 'https://api.waifu.pics/sfw/waifu'

router.get('/get_waifus', (_, res) => {
    currentWaifus = []
    const waifuRequests = []

    for (let i = 0; i < 4; i++) {
        waifuRequests.push(axios(waifuApiUrl))
    }

    Promise.all(waifuRequests).then(responses => {
        const waifus = []

        for (const response of responses) {
            waifus.push(response.data.url)
        }

        res.json(waifus)
    }).catch(() => {
        res.json([])
    })
})

router.post('/save_waifus', (req, res) => {
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
    const user = users.find(user => user.sid = req.user.sid)
    const waifuUrl = req.body.waifuUrl

    user.savedWaifus.push(waifuUrl)
    console.log("save waifu")
    fs.writeFileSync('./users.json', JSON.stringify(users))
    res.end()
})

router.get('/saved_waifus', (req, res) => {
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
    const user = users.find(user => user.sid = req.user.sid)

    res.json(user.savedWaifus)
})

module.exports = router
