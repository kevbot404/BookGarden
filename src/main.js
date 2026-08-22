import ePub from "epubjs";
import "./style.css";

const fileInput = document.getElementById("epubFile");
const reader = document.getElementById("reader");

const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

const locationDisplay = document.getElementById("location");

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

        // get an array of objects representing the table of contents of the EPUB file
        const navigation = await book.loaded.navigation;
        toc = navigation.toc;
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

        locationDisplay.textContent = "";

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