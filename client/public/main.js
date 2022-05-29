document.querySelector('.get-pictures').addEventListener('click', () => {
    category = document.querySelector('select[name="category"]')

    axios('/api/get_pictures/',  {params: {category : category.value}}).then(response => {
        const pictures = response.data
        const picturesEl = document.querySelectorAll('.picture')

        for (let i = 0; i < 4; i++) {

            picturesEl[i].querySelector('img').src = pictures[i]
        }
    }).catch(() => {
        alert('Failes to get pictures')
    })
})

document.querySelector('.save-pictures').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.picture input')

    for (const checkbox of checkboxes) {
        if (checkbox.checked) {
            const pictureImgEl = checkbox.nextElementSibling

            axios.post('/api/save_pictures', { pictureUrl: pictureImgEl.src }).catch(() => {
                alert('Failes to save picture')
            })
        }
    }
})

document.querySelector('.my-pictures-btn').addEventListener('click', () => {
    axios('/api/saved_pictures').then(response => {
        const myPicturesEl = document.querySelector('.my-pictures')
        const pictures = response.data

        myPicturesEl.innerHTML = ''

        for (const picture of pictures) {
            const pictureImg = document.createElement('img')
            pictureImg.src = picture
            myPicturesEl.append(pictureImg)
        }
    }).catch(() => {
        alert('Failes to get saved pictures')
    })
})
