const form = document.getElementsByTagName('form')[0];
const input = form.getElementsByTagName('input')[0];
const ul = document.getElementsByTagName('ul')[0];
const folderBtn = document.querySelector('button.folder');
const linkLike = /^\s*(http(s)?:\/\/)?(www\.|music\.)?youtu(be\.com|\.be)\/(watch(\/)?)?\??[a-zA-Z0-9_&=-]+?\s*$/;

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
    const value = input.value;
    if (!value.trim()) return;
    const newValue = `https://${value.replace(/^http(s)?:\/\//, '')}`;
    if (linkLike.test(newValue)) input.value = newValue;
    processLink(input.value);
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
    if (!['insertFromPaste', 'insertFromDrop'].includes(e.inputType)) return;

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

    input.value = links.length === 1 ? links[0] : '';
    links.forEach(value => { processLink(value); });
    ul.scrollTo({ top: ul.scrollHeight, behavior: 'smooth' });
});
folderBtn.addEventListener('keydown', e => {
    if (e.code === 'Enter') e.stopPropagation();
});
folderBtn.addEventListener('click', () => window.api.folder());
