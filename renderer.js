const form = document.getElementsByTagName('form')[0];
const input = document.getElementsByTagName('input')[0];
const list = document.getElementsByTagName('ul')[0];

form.addEventListener('submit', async event => {
    try {
        event.preventDefault();
        const link = input.value;
        note(`Downloading: ${link}`)
        await window.download(link, 'output.mp3')
        note(`Finished: ${link}`);
    } catch (error) {
        note(`Error: ${link}`)
        throw error;
    }
});

function note(message) {
    const alertBox = document.createElement('li');
    alertBox.className = 'note';
    alertBox.textContent = message;
    list.appendChild(alertBox);
}
