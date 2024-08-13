const externalIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link">
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
</svg>
`;

const refreshIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
</svg>
`;

const loadingIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
</svg>
`;

const xIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
</svg>
`;

const form = document.getElementsByTagName('form')[0];
const input = document.getElementsByTagName('input')[0];
const ul = document.getElementsByTagName('ul')[0];

form.addEventListener('submit', e => { e.preventDefault(); processLink(); });

async function processLink() {
    const link = input.value;
    if (typeof link !== 'string' || !link) return;

    const li = document.createElement('li');
    const div = document.createElement('div');
    const a = document.createElement('a');

    try {
        follow(() => {
            ul.appendChild(li);
            li.appendChild(div);
            li.appendChild(a);
            const span = document.createElement('span');
            span.textContent = 'Link: ';
            div.appendChild(span);
            const a2 = document.createElement('a');
            a2.textContent = a2.href = link;
            div.appendChild(a2);
            a.innerHTML = loadingIcon;
        });

        const title = await window.api.title(link);
        if (typeof title !== 'string' || !title) throw new Error('Invalid title')
        follow(() => {
            div.append('\n');
            const span = document.createElement('span');
            span.textContent = 'Title: ';
            div.appendChild(span);
            div.append(title);
        });

        const location = await window.api.location(title);
        if (typeof location !== 'string' || !location) throw new Error('Invalid location');
        let a2;
        follow(() => {
            div.append('\n');
            const span = document.createElement('span');
            span.textContent = 'Location: ';
            div.appendChild(span);
            a2 = document.createElement('a');
            a2.textContent = location;
            a2.href = location.substring(0, location.lastIndexOf('\\')) || location;
            div.appendChild(a2);
        });

        const { output, dirname } = await window.api.start(link, location);
        if (typeof output !== 'string' || !output) throw new Error('Invalid output');
        if (typeof dirname !== 'string' || !dirname) throw new Error('Invalid dirname');
        follow(() => {
            a2.textContent = output;
            a.innerHTML = externalIcon;
            a.href = dirname;
        });
    } catch (error) {
        if (!link) return li.remove();
        try {
            follow(() => {
                div.append('\nError');
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.innerHTML = xIcon;
                remove.onclick = () => { li.remove(); };
                a.replaceWith(remove);
            });
        } catch (error) {
            li.remove();
            console.error(error);
        }
        console.error(error);
    }
}

function follow(callbackfn) {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    const isBottom = (window.scrollY || scrollTop) + clientHeight >= scrollHeight;
    try {
        callbackfn();
    } finally {
        if (isBottom) scrollBottom();
    }
}

function scrollBottom() {
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
}
