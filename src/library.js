import ePub from "epubjs";
import { readMetadata } from "./helpers.js";

const libraryEl = document.getElementById("library");
const enterReaderButton = document.getElementById("enterReaderBtn");

const sampleBooks = [
    "The Odyssey by Homer.epub",
    "The Adventures of Sherlock Holmes by Arthur Conan Doyle.epub",
    "Moby Dick; Or, The Whale by Herman Melville.epub",
    "Crime and Punishment by Fyodor Dostoyevsky.epub"
];

// Load the library and display book cards
async function loadLibrary() {
    libraryEl.innerHTML = "";

    for (const file of sampleBooks) {
        try {
            const response = await fetch(`/book_samples/${encodeURIComponent(file)}`);
            if (!response.ok) continue;
            const arrayBuffer = await response.arrayBuffer();
            const book = ePub(arrayBuffer);
            const metadata = await readMetadata(book);

            const title = metadata.title || file.replace(".epub", "");
            const author = metadata.creator || "Unknown Author";

            const card = document.createElement("div");
            card.className = "book-card";
            card.innerHTML = `
                <div class="book-cover">📖</div>
                <div class="book-info">
                    <h3>${title}</h3>
                    <p>${author}</p>
                </div>
            `;
            card.addEventListener("click", () => {
                const url = new URL("index.html", window.location.href);
                url.searchParams.set("book", file);
                window.location.href = url.toString();
            });
            libraryEl.appendChild(card);
        } catch (err) {
            console.error("Failed to load book metadata:", file, err);
        }
    }

    if (libraryEl.children.length === 0) {
        libraryEl.innerHTML = "<p>No books found.</p>";
    }
}

loadLibrary();

enterReaderButton.addEventListener("click", () => {
    window.location.href = "index.html";
});
