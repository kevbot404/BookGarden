import ePub from "epubjs";
import { readMetadata } from "./helpers.js";

const libraryEl = document.getElementById("library");
const enterReaderButton = document.getElementById("enterReaderBtn");

const sampleBooks = [
    "The Odyssey by Homer.epub",
    "The Adventures of Sherlock Holmes by Arthur Conan Doyle.epub",
    "Crime and Punishment by Fyodor Dostoyevsky.epub"
];

function getFallbackTitle(file) {
    return file.replace(".epub", "").replace(/ by .*$/, "");
}

function getFallbackAuthor(file) {
    const match = file.match(/ by (.+?)\.epub$/);
    return match ? match[1] : "Unknown Author";
}

async function loadLibrary() {
    libraryEl.innerHTML = "";

    for (const file of sampleBooks) {
        let title, author;

        try {
            const response = await fetch(`/book_samples/${encodeURIComponent(file)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const book = ePub(arrayBuffer);

            try {
                const metadata = await Promise.race([
                    readMetadata(book),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Metadata timeout")), 10000))
                ]);
                title = metadata.title || getFallbackTitle(file);
                author = metadata.creator || getFallbackAuthor(file);
            } catch (metadataErr) {
                console.warn(`Metadata failed for ${file}:`, metadataErr);
                title = getFallbackTitle(file);
                author = getFallbackAuthor(file);
            }
        } catch (err) {
            console.error(`Failed to load book file: ${file}`, err);
            title = getFallbackTitle(file);
            author = "Unavailable";
        }

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
    }

    if (libraryEl.children.length === 0) {
        libraryEl.innerHTML = "<p>No books found.</p>";
    }
}

loadLibrary();

enterReaderButton.addEventListener("click", () => {
    window.location.href = "index.html";
});
