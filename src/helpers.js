// Update the chapter label based on the current location and the table of contents (toc)
export function updateChapter(location, toc) {
    if (!location || !location.start || !toc) {
        return;
    }

    const currentHref = location.start.href;

    if (!currentHref) {
        return;
    }

    const chapter = findTocEntry(currentHref, toc);

    if (chapter) {
        return chapter.label;
    } else {
        return "Unknown Chapter";
    }
}

// Find the corresponding table of contents entry for a given href
export function findTocEntry(href, entries) {
    for (const entry of entries) {
        const entryHref = entry.href.split("#")[0];
        const currentHref = href.split("#")[0];

        if (currentHref.endsWith(entryHref)) {
            return entry;
        }

        if (entry.subitems && entry.subitems.length > 0) {
            const result = findTocEntry(href, entry.subitems);
            if (result) {
                return result;
            }
        }
    }

    return null;
}

// Render the table of contents (toc) as a list of buttons
export function renderToc(entries, container, tocPanel, rendition) {
    container.innerHTML = "";

    for (const entry of entries) {
        const button = document.createElement("button");
        button.className = "toc-entry";
        button.textContent = entry.label;

        button.addEventListener("click", async () => {
            if (!rendition) {
                return;
            }
            await rendition.display(entry.href);
            if (tocPanel) {
                tocPanel.classList.remove("open");
            }
        });

        container.appendChild(button);

        if (entry.subitems && entry.subitems.length > 0) {
            const children = document.createElement("div");
            children.className = "toc-children";
            container.appendChild(children);
            renderToc(entry.subitems, children, tocPanel, rendition);
        }
    }
}

// Read the metadata of the EPUB book
export async function readMetadata(book) {
    const metadata = await book.loaded.metadata;
    console.log("EPUB metadata:", metadata);
    return metadata;
}
