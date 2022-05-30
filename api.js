const express = require('express');
const axios = require('axios');
const fs = require('fs')
const router = express.Router();

const pictureCount = 4;

router.get('/get_pictures', (req, res) => {
    currentPictures = []
    const pictureRequests = []

    category = req.query.category

    let apiUrl = `https://foodish-api.herokuapp.com/api/images/${category}`


    for (let i = 0; i < pictureCount; i++) {
        pictureRequests.push(axios(apiUrl))
    }

    Promise.all(pictureRequests).then(responses => {
        const pictures = []

        for (const response of responses) {
            pictures.push(response.data.image)
        }

        res.json(pictures)
    }).catch(() => {
        res.json([])
    })
})

router.post('/save_pictures', (req, res) => {
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
    const user = users.find(user => user.sid = req.user.sid)
    const pictureUrl = req.body.pictureUrl

    user.savedPictures.push(pictureUrl)
    console.log("save picture")
    fs.writeFileSync('./users.json', JSON.stringify(users))
    res.end()
})

router.get('/saved_pictures', (req, res) => {
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
    const user = users.find(user => user.sid = req.user.sid)

    res.json(user.savedPictures)
})

module.exports = router
