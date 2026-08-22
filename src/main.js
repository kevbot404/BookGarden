import ePub from "epubjs";
import "./style.css";

const fileInput = document.getElementById("epubFile");
const reader = document.getElementById("reader");

const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

const locationDisplay = document.getElementById("location");

let book = null;
let rendition = null;

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

// Update chapter display based on the current location
function updateChapter(location) {

    if (!location || !location.start) {
        return;
    }

    const index = location.start.index;

    if (index === undefined) {
        return;
    }

    locationDisplay.textContent = `Chapter ${index + 1}`;

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