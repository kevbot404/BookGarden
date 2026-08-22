import ePub from "epubjs";
import "./style.css";

const fileInput = document.getElementById("epubFile");

const browseBtn = document.getElementById("browseBtn");

browseBtn.addEventListener("click", () => {
    fileInput.click();
});

const reader = document.getElementById("reader");

const bookTitle = document.getElementById("bookTitle");

const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

const locationDisplay = document.getElementById("location");

const tocButton = document.getElementById("tocButton");
const closeTocButton = document.getElementById("closeToc");

const tocPanel = document.getElementById("toc");
const tocList = document.getElementById("tocList");



let book = null;
let rendition = null;

let toc = [];

// Handle file input change event
// When a user selects an EPUB file, read it (arrayBuffer) and render it using epub.js
fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();

        reader.innerHTML = "";

        book = ePub(arrayBuffer);

        const metadata = await readMetadata(book);

        bookTitle.textContent =
            metadata.title || "Unknown Book";

        // get an array of objects representing the table of contents of the EPUB file
        const navigation = await book.loaded.navigation;
        toc = navigation.toc;
        renderToc(toc);
        console.log("EPUB TOC:", toc);

        rendition = book.renderTo(reader, {
            width: "100%",
            height: "100%",
            flow: "paginated"
        });

        rendition.on("relocated", (location) => {

            updateChapter(location);

        });

        await rendition.display();

        console.log("EPUB loaded:", file.name);

    } catch (error) {
        console.error("Failed to load EPUB:", error);
        locationDisplay.textContent = "Failed to load EPUB";
    }

});

// find current chapter based on the toc and update the display
function updateChapter(location) {

    if (!location || !location.start || !book) {
        return;
    }

    const currentHref = location.start.href;

    if (!currentHref) {
        return;
    }

    const chapter = findTocEntry(currentHref, toc);

    if (chapter) {

        locationDisplay.textContent = chapter.label;

    } else {

        locationDisplay.textContent = "Unknown Chapter";

    }

}

// find matching TOC entry (helper function for updateChapter)
function findTocEntry(href, entries) {

    for (const entry of entries) {

        // remove fragment (#something)
        const entryHref = entry.href.split("#")[0];
        const currentHref = href.split("#")[0];

        if (currentHref.endsWith(entryHref)) {

            return entry;

        }

        // check nested TOC entries
        if (entry.subitems && entry.subitems.length > 0) {

            const result = findTocEntry(
                href,
                entry.subitems
            );

            if (result) {
                return result;
            }

        }

    }

    return null;

}

// Render the table of contents (TOC) in the TOC panel
function renderToc(entries, container = tocList) {

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

            // Close TOC after selecting a chapter
            tocPanel.classList.remove("open");

        });

        container.appendChild(button);


        // Nested TOC entries
        if (entry.subitems && entry.subitems.length > 0) {

            const children = document.createElement("div");

            children.className = "toc-children";

            container.appendChild(children);

            renderToc(
                entry.subitems,
                children
            );

        }

    }

}

tocButton.addEventListener("click", () => {

    tocPanel.classList.toggle("open");

});

closeTocButton.addEventListener("click", () => {

    tocPanel.classList.remove("open");

});

// Button navigation
previousButton.addEventListener("click", () => {

    if (!rendition) {
        return;
    }

    rendition.prev();
});

nextButton.addEventListener("click", () => {

    if (!rendition) {
        return;
    }

    rendition.next();
});

// Keyboard navigation
document.addEventListener("keydown", (event) => {

    if (!rendition) {
        return;
    }

    if (event.key === "ArrowLeft") {
        rendition.prev();
    }

    if (event.key === "ArrowRight") {
        rendition.next();
    }
});

async function readMetadata(book) {
    const metadata = await book.loaded.metadata;
    console.log("EPUB metadata:", metadata);
    return metadata;
}