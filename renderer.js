const form = document.getElementsByTagName('form')[0];
const input = document.getElementsByTagName('input')[0];
const ul = document.getElementsByTagName('ul')[0];

form.addEventListener('submit', async event => {
    event.preventDefault();
    let link, li;
    try {
        li = document.createElement('li');
        ul.appendChild(li);

        link = input.value;
        if (typeof link !== 'string' || !link) throw new Error('Invalid link');
        li.textContent = `Link: ${link}\nSearching...`;

        const title = await window.api.title(link)
        if (typeof title !== 'string' || !title) throw new Error('Invalid title');
        li.textContent = `Link: ${link}\nTitle: ${title}\nOpening...`;

        const output = await window.api.location(title);
        if (typeof output !== 'string' || !output) throw new Error('Invalid Output');
        li.textContent = `Link: ${link}\nTitle: ${title}\nOutput: ${output}\nDownloading...`;

        const folder = await window.api.start(link, output);
        if (typeof folder !== 'string' || !folder) throw new Error('Invalid Folder');
        li.textContent = `Link: ${link}\nTitle: ${title}\nOutput: `;
        const a = document.createElement('a');
        a.textContent = output;
        a.href = folder;
        li.append(a);
    } catch (error) {
        li.textContent = link ? `Link: ${link}\nError` : `Error`;
        console.error(error);
        throw error;
    }
});
