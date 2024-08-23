const form = document.getElementsByTagName('form')[0];
const input = form.getElementsByTagName('input')[0];
const ul = document.getElementsByTagName('ul')[0];
const folderBtn = document.querySelector('button.folder');
const linkLike = /^\s*(http(s)?:\/\/)?(www\.|music\.)?youtu(be\.com|\.be)\/(watch(\/)?)?\??[a-zA-Z0-9_&=-]+?\s*$/;

document.addEventListener('click', e => {
    const containers = [document.documentElement, document.body, ul];
    if (!containers.includes(e.target)) return;
    input.focus();
    input.select();
})
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    input.focus();
    input.select();
});
document.addEventListener('keyup', e => {
    if (!e.ctrlKey) return;
    if (e.code === 'Enter') form.requestSubmit();
    if (e.code === 'KeyF') folderBtn?.click();
});
form.addEventListener('submit', e => {
    e.preventDefault();
    const links = Array.from(new Set(input
        .value
        .split(/\s+/)
        .filter(x => linkLike.test(x))
        .map(x => {
            const y = `https://${x.replace(/^http(s)?:\/\//, '')}`;
            return linkLike.test(y) ? y : x;
        })
    ));
    if (!links.length) return;

    const item = links.shift();
    input.value = links.join(' ') || item;
    input.setSelectionRange(0, 0);
    input.scrollLeft = 0;
    input.focus();
    processLink(item);
    ul.scrollTo({ top: ul.scrollHeight, behavior: 'smooth' });
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
input.addEventListener('input', e => {
    if (
        e.inputType === 'insertFromPaste' &&
        linkLike.test(input.value)
    ) form.requestSubmit();
});
folderBtn.addEventListener('keydown', e => {
    if (e.code === 'Enter') e.stopPropagation();
});
folderBtn.addEventListener('click', () => window.api.folder());
