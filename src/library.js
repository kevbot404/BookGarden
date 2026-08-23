import ePub from "epubjs";
import { readMetadata } from "./helpers.js";
import { saveBook, getAllBooks, deleteBook } from "./bookStore.js";

const libraryEl = document.getElementById("library");
const enterReaderButton = document.getElementById("enterReaderBtn");
const browseBtn = document.getElementById("browseBtn");
const epubFileInput = document.getElementById("epubFile");

let libraryBooks = [];

function getFallbackTitle(file) {
    return file.replace(".epub", "").replace(/ by .*$/, "");
}

function getFallbackAuthor(file) {
    const match = file.match(/ by (.+?)\.epub$/);
    return match ? match[1] : "Unknown Author";
}

// Convert a cover URL to a data URL so it can be stored in IndexedDB
async function coverUrlToDataUrl(url) {
    if (!url) return null;
    if (url.startsWith("data:")) return url;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to convert cover URL:", e);
        return null;
    }
}

// Seed sample books into IndexedDB if no books exist yet
async function seedSampleBooks() {
    const sampleFiles = [
        "The-Adventures-of-Sherlock-Holmes-by-Arthur-Conan-Doyle.epub",
        "Crime-and-Punishment-by-Fyodor-Dostoyevsky.epub"
    ];

    const existing = await getAllBooks();
    if (existing.length > 0) {
        return;
    }

    for (const file of sampleFiles) {
        try {
            const response = await fetch(`book_samples/${file}`);
            if (!response.ok) {
                console.warn(`Sample book not found: ${file}`);
                continue;
            }
            const arrayBuffer = await response.arrayBuffer();
            const book = ePub(arrayBuffer);

            let title = getFallbackTitle(file);
            let author = getFallbackAuthor(file);
            let coverUrl = null;

            try {
                const metadata = await Promise.race([
                    readMetadata(book),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Metadata timeout")), 10000))
                ]);
                title = metadata.title || title;
                author = metadata.creator || author;
            } catch (metadataErr) {
                console.warn(`Metadata failed for ${file}:`, metadataErr);
            }

            try {
                const rawCoverUrl = await book.coverUrl();
                if (rawCoverUrl) {
                    coverUrl = await coverUrlToDataUrl(rawCoverUrl);
                }
            } catch (coverErr) {
                console.warn(`Cover failed for ${file}:`, coverErr);
            }

            const bookId = `sample-${file.replace(".epub", "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
            await saveBook({
                id: bookId,
                arrayBuffer,
                metadata: { title, author, coverUrl }
            });
        } catch (err) {
            console.error(`Failed to seed sample book ${file}:`, err);
        }
    }
}

// Load the library from IndexedDB
async function loadLibrary() {
    libraryEl.innerHTML = "";

    try {
        const stored = await getAllBooks();
        libraryBooks = stored.map(entry => ({
            id: entry.id,
            title: entry.metadata?.title || "Unknown Title",
            author: entry.metadata?.author || "Unknown Author",
            coverUrl: entry.metadata?.coverUrl || null
        }));
    } catch (err) {
        console.error("Failed to load library:", err);
        libraryBooks = [];
    }

    for (const book of libraryBooks) {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <div class="book-cover">
                <img alt="${book.title} cover" />
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
            </div>
            <hr class="book-separator" />
            <button class="remove-book-btn" data-id="${book.id}">Remove</button>
        `;

        if (book.coverUrl) {
            const img = card.querySelector("img");
            if (img) {
                img.src = book.coverUrl;
            }
        }

        const removeButton = card.querySelector(".remove-book-btn");
        removeButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            const confirmRemove = confirm(`Remove "${book.title}" from your library?`);
            if (!confirmRemove) {
                return;
            }
            try {
                await deleteBook(book.id);
                loadLibrary();
            } catch (error) {
                console.error("Failed to remove book:", error);
                alert("Failed to remove book. Please try again.");
            }
        });

        card.addEventListener("click", () => {
            const url = new URL("index.html", window.location.href);
            url.searchParams.set("book", book.id);
            window.location.href = url.toString();
        });
        libraryEl.appendChild(card);
    }

    if (libraryEl.children.length === 0) {
        libraryEl.innerHTML = "<p>No books found.</p>";
    }
}

browseBtn.addEventListener("click", () => {
    epubFileInput.click();
});

// Handle user-uploaded EPUB files
epubFileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);

        let title = file.name.replace(".epub", "");
        let author = "Unknown Author";
        let coverUrl = null;

        try {
            const metadata = await Promise.race([
                readMetadata(book),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Metadata timeout")), 10000))
            ]);
            title = metadata.title || title;
            author = metadata.creator || author;
        } catch (metadataErr) {
            console.warn("Metadata failed for user book:", metadataErr);
        }

        try {
            const rawCoverUrl = await book.coverUrl();
            if (rawCoverUrl) {
                coverUrl = await coverUrlToDataUrl(rawCoverUrl);
            }
        } catch (coverErr) {
            console.warn("Cover failed for user book:", coverErr);
        }

        const bookId = `user-book-${Date.now()}`;
        await saveBook({
            id: bookId,
            arrayBuffer,
            metadata: { title, author, coverUrl }
        });

        loadLibrary();
    } catch (error) {
        console.error("Failed to load user book:", error);
        alert("Failed to load book. Please try another file.");
    }
});

// Initialize sample books and load the library
async function init() {
    await seedSampleBooks();
    loadLibrary();
}

init();

enterReaderButton.addEventListener("click", () => {
    window.location.href = "index.html";
});
