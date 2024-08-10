const body = document.body;
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

const errorIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ban">
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
</svg>
`;

const loadingIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
</svg>
`;

form.addEventListener('submit', async event => {
    event.preventDefault();
    let link, li, div, a;
    try {
        li = document.createElement('li');
        div = document.createElement('div');
        a = document.createElement('a');
        link = input.value;
        if (typeof link !== 'string' || !link) throw new Error('Invalid link');
        follow(() => {
            ul.appendChild(li);
            li.appendChild(div);
            li.appendChild(a);
            div.textContent = `Link: ${link}`;
            a.innerHTML = loadingIcon;
        });

        const title = await window.api.title(link)
        if (typeof title !== 'string' || !title) throw new Error('Invalid title');
        follow(() => {
            div.textContent += `\nTitle: ${title}`;
        });

        const { location, canceled } = await window.api.location(title);
        if (canceled) return li.remove();
        if (typeof location !== 'string' || !location) throw new Error('Invalid Output');
        follow(() => {
            div.textContent += `\nLocation: ${location}`;
        });

        const folder = await window.api.start(link, location);
        if (typeof folder !== 'string' || !folder) throw new Error('Invalid Folder');
        follow(() => {
            a.innerHTML = externalLink;
            a.href = folder;
        });
    } catch (error) {
        follow(() => {
            a.innerHTML = errorIcon;
            div.textContent = link ? `Link: ${link}\nError` : `Error`;
        });
        console.error(error);
        throw error;
    }
});

function follow(callbackfn) {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    const isBottom = (window.scrollY || scrollTop) + clientHeight >= scrollHeight;
    callbackfn();
    if (isBottom) window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
}
