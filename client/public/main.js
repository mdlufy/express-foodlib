document.querySelector('.get-waifus').addEventListener('click', () => {
    axios('/api/get_waifus').then(response => {
        const waifus = response.data
        const waifusEl = document.querySelectorAll('.waifu')

        for (let i = 0; i < 4; i++) {

            waifusEl[i].querySelector('img').src = waifus[i]
        }
    }).catch(() => {
        alert('Failes to get waifus')
    })
})

document.querySelector('.save-waifus').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.waifu input')

    for (const checkbox of checkboxes) {
        if (checkbox.checked) {
            const waifuImgEl = checkbox.nextElementSibling

            axios.post('/api/save_waifus', { waifuUrl: waifuImgEl.src }).catch(() => {
                alert('Failes to save picture')
            })
        }
    }
})

document.querySelector('.my-waifus-btn').addEventListener('click', () => {
    axios('/api/saved_waifus').then(response => {
        const myWaifusEl = document.querySelector('.my-waifus')
        const waifus = response.data

        myWaifusEl.innerHTML = ''

        for (const waifu of waifus) {
            const waifuImg = document.createElement('img')
            waifuImg.src = waifu
            myWaifusEl.append(waifuImg)
        }
    }).catch(() => {
        alert('Failes to get saved waifus')
    })
})
