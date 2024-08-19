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
