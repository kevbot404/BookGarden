import ePub from "epubjs";
import "./style.css";

const fileInput = document.getElementById("epubFile");
const reader = document.getElementById("reader");

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

        await rendition.display();

        console.log("EPUB loaded:", file.name);

    } catch (error) {
        console.error("Failed to load EPUB:", error);
    }

});