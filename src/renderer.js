const form = document.getElementsByTagName('form')[0];
const input = document.getElementsByTagName('input')[0];
const button = document.getElementsByTagName('button')[0];
const ul = document.getElementsByTagName('ul')[0];

const externalLink = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link">
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
</svg>
`;

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
        li.textContent = `Link: ${link}\nTitle: ${title}\nOutput: ${output}`;
        const a = document.createElement('a');
        a.innerHTML = externalLink;
        a.href = folder;
        li.append(a);
    } catch (error) {
        li.textContent = link ? `Link: ${link}\nError` : `Error`;
        console.error(error);
        throw error;
    }
});
