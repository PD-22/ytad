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

function progressIcon(percent, s = 24, r = 9, o = .125) {
    percent = Math.max(0, Math.min(percent, 1));
    const length = 2 * Math.PI * r;
    const dashoffset = length * (1 - percent);
    return `
        <svg 
            xmlns="http://www.w3.org/2000/svg"       
            width="${s}"     
            height="${s}"    
            viewBox="0 0 ${s} ${s}"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-loader-circle"
        >
            <circle
                cx="${s / 2}"
                cy="${s / 2}"
                r="${r}"
                stroke-opacity="${o}"
                fill="none"
            ></circle>
            <circle
                cx="${s / 2}"
                cy="${s / 2}"
                r="${r}"
                stroke-dasharray="${length}"
                stroke-dashoffset="${dashoffset}"
                transform="rotate(-90 ${s / 2} ${s / 2})"
            >
            </circle>
        </svg>
    `;
}

const xIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
</svg>
`;

const minusIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus">
    <path d="M5 12h14" />
</svg>
`;

const rotateIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
</svg>
`;

const form = document.getElementsByTagName('form')[0];
const input = form.getElementsByTagName('input')[0];
const button = form.getElementsByTagName('button')[0];
const ul = document.getElementsByTagName('ul')[0];
const folderBtn = document.querySelector('button.folder');

form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value;
    if (!value.trim()) return;
    if (!/http(s):\/\//.test(value)) input.value = `https://${value}`;
    processLink(value);
});
form.addEventListener('keyup', e => {
    const tag = e.target.tagName;
    if (e.code === "Enter" && (tag === "INPUT" || tag === "BUTTON"))
        form.requestSubmit();
});
form.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (e.code === "Enter" && (tag === "INPUT" || tag === "BUTTON"))
        e.preventDefault();
});
input.addEventListener('paste', () => setTimeout(() => {
    const linkLike = /^\s*(http(s)?:\/\/)?(www\.|music\.)?youtu(be\.com|\.be)\S+\s*$/;
    if (linkLike.test(input.value)) form.requestSubmit();
}));
folderBtn.addEventListener('keydown', e => {
    if (e.code === 'Enter') e.stopPropagation();
});
folderBtn.addEventListener('click', () => window.api.folder());

async function processLink(link, li) {
    const a = document.createElement('a');
    const a2 = document.createElement('a');
    const container = document.createElement('div');
    const kill = document.createElement('button');
    let reject;
    const rejectable = (promise, callback) => {
        const rejectPromise = new Promise((_, r) => {
            reject = reason => { r(reason); callback?.(); }
        });
        return Promise.race([promise, rejectPromise]);
    };
    let setPercent = p => {
        a.classList.add('no-spin');
        a.innerHTML = progressIcon(p);
    };

    try {
        follow(() => {
            if (!li) ul.appendChild(li = document.createElement('li'))
            li.innerHTML = '';
            li.appendChild(a2);
            a2.className = 'info opaque';
            a2.title = a2.textContent = a2.href = link;

            li.appendChild(container);
            container.className = 'container';

            container.append(a)
            a.className = 'btn';
            a.innerHTML = loadingIcon;
            a.classList.add('under');

            container.appendChild(kill);
            kill.className = 'btn over';
            kill.type = 'button';
            kill.innerHTML = xIcon;
            kill.onclick = () => { reject?.('loading aborted'); };
        });

        const { url, title } = await rejectable(window.api.info(link));
        if (typeof title !== 'string' || !title) throw new Error('Invalid title')
        if (typeof url !== 'string' || !url) throw new Error('Invalid url')
        follow(() => {
            a2.classList.remove('opaque')
            a2.textContent = title;
            a2.title = a2.href = link = url;
        });

        const id = Math.random();
        window.api.onProgress(id, p => setPercent?.(p));
        const output = await rejectable(
            window.api.download(id, link, title),
            () => window.api.kill(id)
        );
        if (output?.error === 'cancel') throw 'cancel';
        if (typeof output !== 'string' || !output) throw new Error('Invalid output');
        follow(() => {
            kill.remove();
            a.innerHTML = externalIcon;
            a.title = a.href = output;
            a.classList.remove('under');
        });
    } catch (error) {
        if (!link) return li.remove();
        follow(() => {
            kill.className = 'btn';
            kill.innerHTML = minusIcon;
            kill.onclick = () => { li.remove(); };
            a.remove();
            a2.classList.remove('opaque');
            const retry = document.createElement('button');
            retry.className = 'btn extra'
            retry.innerHTML = rotateIcon
            retry.onclick = () => { processLink(link, li); }
            container.prepend(retry);
        });
        if (error !== 'cancel') console.error(error);
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
