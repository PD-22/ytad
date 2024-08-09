const form = document.getElementsByTagName('form')[0];
const input = document.getElementsByTagName('input')[0];
const list = document.getElementsByTagName('ul')[0];

form.addEventListener('submit', async event => {
    let link, title;
    try {
        event.preventDefault();
        link = input.value;
        if (typeof link !== 'string' || !link) throw new Error('Invalid link');
        log('Checking: ', link)

        title = await window.api.title(link)
        if (typeof title !== 'string' || !title) throw new Error('Invalid title');

        log(`Locating: "${title}"`);
        const output = await window.api.location(title);
        if (typeof output !== 'string' || !output) throw new Error('Invalid output');

        log(`Downloading: ${link} - "${title}" to ${output}`);
        const result = await window.api.start(link, output);
        log(`Result: `, result);
    } catch (error) {
        if (title)
            log(`Error: ${title}`);
        else if (link)
            log('Error: ', link);
        else
            log('Error');
        throw error;
    }
});

function log(message, url) {
    console.log(message, url);
    const listItem = document.createElement('li');
    listItem.textContent = message;
    if (url) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = url;
        listItem.append(anchor);
    }
    list.appendChild(listItem);
}
