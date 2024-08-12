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
const button = document.getElementsByTagName('button')[0];
const ul = document.getElementsByTagName('ul')[0];
const pre = document.getElementsByTagName('pre')[0];
const onInputTimeoutListeners = new Set();
let currentTitle, timeout, cancelFetch;
input.addEventListener('input', onInput);
form.addEventListener('submit', e => { e.preventDefault(); processLink(); });

function onInput() {
    clearTimeout(timeout);
    cancelFetch?.();
    currentTitle = undefined;
    if (!input.value) return;
    timeout = setTimeout(onInputTimeout, 300);
}

async function onInputTimeout() {
    const link = input.value;
    if (!link) return;
    try {
        timeout = undefined;
        const state = { cancel: false };
        cancelFetch = () => state.cancel = true;
        const newTitle = await window.api.title(link);
        if (typeof newTitle !== 'string' || !newTitle) throw new Error('Invalid title response');
        if (state.cancel) return;

        currentTitle = newTitle;
        onInputTimeoutListeners.forEach(x => x.resolve(newTitle));
        return newTitle;
    } catch (error) {
        onInputTimeoutListeners.forEach(x => x.reject());
        currentTitle = undefined;
    } finally {
        cancelFetch = undefined;
        onInputTimeoutListeners.clear();
    }
}

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

        const title = await getProcessLinkTitle();
        if (typeof title !== 'string' || !title) throw new Error('Invalid title')
        follow(() => {
            div.append('\n');
            const span = document.createElement('span');
            span.textContent = 'Title: ';
            div.appendChild(span);
            div.append(title);
        });

        const location = await window.api.location(title);
        if (typeof location !== 'string' || !location) throw new Error('Invalid Output');
        follow(() => {
            div.append('\n');
            const span = document.createElement('span');
            span.textContent = 'Location: ';
            div.appendChild(span);
            {
                const a = document.createElement('a');
                a.textContent = location;
                a.href = location.substring(0, location.lastIndexOf('\\')) || location;
                div.appendChild(a);
            }
        });

        const folder = await window.api.start(link, location);
        if (typeof folder !== 'string' || !folder) throw new Error('Invalid Folder');
        follow(() => {
            a.innerHTML = externalIcon;
            a.href = folder;
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

async function getProcessLinkTitle() {
    if (timeout) {
        // waiting for input to stop
        // stop waiting and trigger fetch immediately
        clearTimeout(timeout);
        return await onInputTimeout();
    } else if (cancelFetch) {
        // already fetching title
        // listen for ongoing fetch
        return await new Promise((resolve, reject) => {
            onInputTimeoutListeners.add({ resolve, reject });
        });
    } else if (currentTitle) {
        // title for is already fetched
        // just use prepared title
        return currentTitle;
    } else {
        // no title available
        // try to fetch title
        return await onInputTimeout();
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
