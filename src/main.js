import ePub from "epubjs";
import "./style.css";
import { updateChapter, findTocEntry, renderToc, readMetadata } from "./helpers.js";

const fileInput = document.getElementById("epubFile");

const browseBtn = document.getElementById("browseBtn");

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
        console.log("EPUB TOC:", toc);

        rendition = book.renderTo(reader, {
            width: "100%",
            height: "100%",
            flow: "paginated"
        });

        renderToc(toc, tocList, tocPanel, rendition);

        rendition.on("relocated", (location) => {

            const label = updateChapter(location, toc);
            if (label) {
                locationDisplay.textContent = label;
            }

        });

        await rendition.display();

        console.log("EPUB loaded:", file.name);

    } catch (error) {
        console.error("Failed to load EPUB:", error);
        locationDisplay.textContent = "Failed to load EPUB";
    }

});

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

browseBtn.addEventListener("click", () => {
    fileInput.click();
});