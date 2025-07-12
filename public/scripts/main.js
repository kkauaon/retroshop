var platforms;

fetch('/jsons/platforms.json').then(res => res.json()).then(data => {
    platforms = data;
})

function getPlatformBySlug(slug) {
    return platforms.find(z => z.slug == slug)
}

window.getPlatformBySlug = getPlatformBySlug;