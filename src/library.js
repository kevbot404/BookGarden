import ePub from "epubjs";
import { readMetadata } from "./helpers.js";
import { saveBook, getAllBooks, deleteBook } from "./bookStore.js";

const libraryEl = document.getElementById("library");
const enterReaderButton = document.getElementById("enterReaderBtn");
const browseBtn = document.getElementById("browseBtn");
const epubFileInput = document.getElementById("epubFile");

const sampleBooks = [
    "The Adventures of Sherlock Holmes by Arthur Conan Doyle.epub",
    "Crime and Punishment by Fyodor Dostoyevsky.epub"
];

let userBooks = [];

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

// Load user books from IndexedDB
async function loadUserBooks() {
    try {
        const stored = await getAllBooks();
        userBooks = stored.map(entry => ({
            id: entry.id,
            title: entry.metadata?.title || "Unknown Title",
            author: entry.metadata?.author || "Unknown Author",
            coverUrl: entry.metadata?.coverUrl || null
        }));
    } catch (err) {
        console.error("Failed to load user books:", err);
        userBooks = [];
    }
}

// Load the library with sample and user-uploaded books
async function loadLibrary() {
    libraryEl.innerHTML = "";

    await loadUserBooks();

    for (const file of sampleBooks) {
        let title, author;
        let book = null;

        try {
            const response = await fetch(`/book_samples/${encodeURIComponent(file)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            book = ePub(arrayBuffer);

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
            <div class="book-cover">
                <img alt="${title} cover" />
            </div>
            <div class="book-info">
                <h3>${title}</h3>
                <p>${author}</p>
            </div>
        `;

        if (book) {
            book.coverUrl().then((coverUrl) => {
                const img = card.querySelector("img");
                if (img && coverUrl) {
                    img.src = coverUrl;
                }
            });
        }

        card.addEventListener("click", () => {
            const url = new URL("index.html", window.location.href);
            url.searchParams.set("book", file);
            window.location.href = url.toString();
        });
        libraryEl.appendChild(card);
    }

    for (const userBook of userBooks) {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <div class="book-cover">
                <img alt="${userBook.title} cover" />
            </div>
            <div class="book-info">
                <h3>${userBook.title}</h3>
                <p>${userBook.author}</p>
            </div>
            <button class="remove-book-btn" data-id="${userBook.id}">Remove</button>
        `;

        if (userBook.coverUrl) {
            const img = card.querySelector("img");
            if (img) {
                img.src = userBook.coverUrl;
            }
        }

        const removeButton = card.querySelector(".remove-book-btn");
        removeButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            const confirmRemove = confirm(`Remove "${userBook.title}" from your library?`);
            if (!confirmRemove) {
                return;
            }
            try {
                await deleteBook(userBook.id);
                userBooks = userBooks.filter(b => b.id !== userBook.id);
                loadLibrary();
            } catch (error) {
                console.error("Failed to remove book:", error);
                alert("Failed to remove book. Please try again.");
            }
        });

        card.addEventListener("click", () => {
            const url = new URL("index.html", window.location.href);
            url.searchParams.set("userBook", userBook.id);
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

        userBooks.push({
            id: bookId,
            title,
            author,
            coverUrl
        });

        epubFileInput.value = "";

        loadLibrary();
    } catch (error) {
        console.error("Failed to load user book:", error);
        alert("Failed to load book. Please try another file.");
    }
});

// Load the library when the page is ready
loadLibrary();

enterReaderButton.addEventListener("click", () => {
    window.location.href = "index.html";
});
