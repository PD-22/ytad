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

function progressIcon(percent, s = 24, r = 9, o = 1 / 2 ** 3) {
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

const form = document.getElementsByTagName('form')[0];
const input = form.getElementsByTagName('input')[0];
const button = form.getElementsByTagName('button')[0];
const ul = document.getElementsByTagName('ul')[0];

form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value;
    if (!value.trim()) return;
    if (!/http(s):\/\//.test(value)) input.value = `https://${value}`;
    processLink();
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

async function processLink() {
    let link = input.value;
    if (typeof link !== 'string' || !link) return;

    const li = document.createElement('li');
    const a = document.createElement('a');
    const a2 = document.createElement('a');
    let kill, container;
    let setPercent = p => {
        a.classList.add('no-spin');
        a.innerHTML = progressIcon(p);
    };

    try {
        follow(() => {
            ul.appendChild(li);
            li.appendChild(a2);
            li.appendChild(a);
            a2.className = 'info opaque';
            a2.title = a2.textContent = a2.href = link;
            a.className = 'btn';
            a.innerHTML = loadingIcon;
        });

        const { url, title } = await window.api.info(link);
        if (typeof title !== 'string' || !title) throw new Error('Invalid title')
        if (typeof url !== 'string' || !url) throw new Error('Invalid url')
        follow(() => {
            a2.classList.remove('opaque')
            a2.textContent = title;
            a2.title = a2.href = link = url;
        });

        const location = await window.api.location(title);
        if (typeof location !== 'string' || !location) throw new Error('Invalid location');

        const id = Math.random();
        window.api.onProgress(id, p => setPercent?.(p));

        follow(() => {
            container = document.createElement('div');
            a.title = location;
            container.className = 'container';
            a.replaceWith(container);
            container.append(a)
            a.classList.add('under');
            kill = document.createElement('button');
            kill.innerHTML = xIcon;
            kill.className = 'btn over';
            kill.type = 'button';
            kill.addEventListener('click', (() => window.api.kill(id)));
            container.appendChild(kill);
        });

        const output = await window.api.start(id, link, location);
        if (typeof output !== 'string' || !output) throw new Error('Invalid output');
        follow(() => {
            a.innerHTML = externalIcon;
            a.title = a.href = output;
        });
    } catch (error) {
        if (!link) return li.remove();
        follow(() => {
            const remove = document.createElement('button');
            remove.className = 'btn';
            remove.type = 'button';
            remove.innerHTML = minusIcon;
            remove.onclick = () => { li.remove(); };
            a.replaceWith(remove);
            a2.classList.remove('opaque');
        });
        console.error(error);
    } finally {
        kill?.remove();
        container.replaceWith(...container.children);
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
