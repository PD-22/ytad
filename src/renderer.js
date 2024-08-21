const form = document.getElementsByTagName('form')[0];
const input = form.getElementsByTagName('input')[0];
const ul = document.getElementsByTagName('ul')[0];
const folderBtn = document.querySelector('button.folder');

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
input.addEventListener('input', e => {
    const isPaste = e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop';
    const linkLike = /^\s*(http(s)?:\/\/)?(www\.|music\.)?youtu(be\.com|\.be)\S+\s*$/;
    if (isPaste && linkLike.test(input.value)) form.requestSubmit();
});
folderBtn.addEventListener('keydown', e => {
    if (e.code === 'Enter') e.stopPropagation();
});
folderBtn.addEventListener('click', () => window.api.folder());
