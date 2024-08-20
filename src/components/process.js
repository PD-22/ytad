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
            a2.className = 'info';
            a2.textContent = link;

            li.appendChild(container);
            container.className = 'container';

            container.append(a)
            a.className = 'btn';
            a.innerHTML = loadingIcon;
            a.classList.add('under');

            container.appendChild(kill);
            kill.className = 'btn over';
            kill.type = 'button';
            kill.title = 'Cancel';
            kill.innerHTML = xIcon;
            kill.onclick = () => { reject?.('cancel'); };
        });

        const { url, title } = await rejectable(window.api.info(link));
        if (typeof title !== 'string' || !title) throw new Error('Invalid title')
        if (typeof url !== 'string' || !url) throw new Error('Invalid url')
        follow(() => {
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
            const wasActive = document.activeElement === kill;
            kill.remove();
            a.innerHTML = externalIcon;
            a.title = a.href = output;
            a.classList.remove('under');
            if (wasActive) a.focus();
        });
    } catch (error) {
        if (!link) return li.remove();
        follow(() => {
            kill.className = 'btn';
            kill.innerHTML = minusIcon;
            kill.title = 'Remove';
            kill.onclick = () => {
                const li2 = li.nextElementSibling;
                li.remove();
                li2
                    .querySelector('.container')
                    .querySelector('a[href], button')
                    ?.focus();
            };
            a.remove();
            const retry = document.createElement('button');
            retry.className = 'btn extra';
            retry.innerHTML = rotateIcon;
            retry.title = 'Retry';
            retry.onclick = () => {
                processLink(link, li);
                li.querySelector('.container .btn.over')?.focus();
            };
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
