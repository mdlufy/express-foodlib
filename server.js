const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser');
const fs = require('fs')
const api = require('./api')
const app = express()

app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded())
app.set('views', './client')
app.set('view engine', 'pug');

app.use((req, res, next) => {
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
    const sessions = JSON.parse(fs.readFileSync('./sessions.json', 'utf8'))
    const sid = req.cookies.sid || req.query.sid || req.body.sid
    const user = users.find(user => user.sid === sid)
    console.log(sid)
    console.log(users)
    console.log(user)

    if (user && user.expire > Date.now()) {
        req.user = user
        next()
        return
    }

    if (/api/.test(req.url)) {
        res.json({ status: 'unauth' })
        return
    }

    const uuid = generateUUID()
    sessions.push(uuid)
    console.log(sessions)
    fs.writeFileSync('./sessions.json', JSON.stringify(sessions))

    res.cookie('sid', uuid)
    res.render('auth', { uuid })
})

function renderPublicFile(req, res) {
    const fileName = req.url.slice(1)
    const absFileName = path.resolve(path.join('client', fileName))

    res.sendFile(absFileName)
}

function generateUUID() { 
    var d = new Date().getTime(); 
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;
        if (d > 0) { 
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

app.use('/api', api)

app.get('/', (_, res) => {
    console.log('index file')
    res.sendFile(path.resolve('client/index.html'))
})

app.get('/public/*', renderPublicFile)

const PORT = process.env.PORT || 3005;

app.listen(PORT)
