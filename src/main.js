import ePub from "epubjs";
import "./style.css";

import {
    updateChapter,
    findTocEntry,
    renderToc,
    readMetadata
} from "./helpers.js";

import { getBook } from "./bookStore.js";

import {
    applyReaderSettings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    setLineHeight,
    setTheme,
    setTextAlign,
    setReaderWidth,
    setReaderHeight,
    resetReaderSettings,
    getReaderSettings
} from "./readerSettings.js";


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
const settingsButton = document.getElementById("settingsButton");
const closeSettingsButton = document.getElementById("closeSettings");
const settingsPanel = document.getElementById("readerSettings");
const viewModeButton = document.getElementById("viewModeButton");
const enterLibraryButton = document.getElementById("enterLibraryBtn");

const fontIncreaseButton = document.getElementById("fontIncrease");
const fontDecreaseButton = document.getElementById("fontDecrease");
const fontFamilySelect = document.getElementById("fontFamily");
const lineHeightSelect = document.getElementById("lineHeight");
const themeSelect = document.getElementById("theme");
const textAlignSelect = document.getElementById("textAlign");
const readerWidthSelect = document.getElementById("readerWidth");
const readerHeightSelect = document.getElementById("readerHeight");
const resetSettingsButton = document.getElementById("resetSettings");

let book = null;
let rendition = null;
let toc = [];
let viewMode = "scrolled-doc";

// Create a new rendition of the book and render it to the reader element
// Apply the current reader settings to the rendition, and set up event listeners for location changes
// and TOC rendering
function createRendition() {
    if (!book) {
        return null;
    }

    const settings = getReaderSettings();

    reader.innerHTML = "";

    const newRendition = book.renderTo(reader, {
        width: settings.readerWidth,
        height: settings.readerHeight,
        flow: viewMode
    });

    applyReaderSettings(newRendition);

    newRendition.on("relocated", (location) => {
        const label = updateChapter(location, toc);
        if (label) {
            locationDisplay.textContent = label;
        }
    });

    renderToc(toc, tocList, tocPanel, newRendition);

    return newRendition;
}

// Update the view mode button text and title based on the current view mode.
// should probably just make it a 'switch view mode' button instead.
function updateViewModeButton() {
    if (!viewModeButton) {
        return;
    }

    if (viewMode === "scrolled-doc") {
        viewModeButton.textContent = "Change to Pages format";
        viewModeButton.title = "Switch to page view";
    } else {
        viewModeButton.textContent = "Change to Scrolled format";
        viewModeButton.title = "Switch to scroll view";
    }
}

// Set the view mode (scrolled-doc or paginated)
// and re-render the book while preserving the current reading position
async function setViewMode(mode) {
    if (!book || !rendition) {
        return;
    }

    let currentCfi = null;

    try {
        const currentLocation = rendition.currentLocation();
        if (currentLocation && currentLocation.start && currentLocation.start.cfi) {
            currentCfi = currentLocation.start.cfi;
        }
    } catch (error) {
        console.warn("Could not save current location:", error);
    }

    try {
        rendition.destroy();
    } catch (error) {
        console.warn("Could not destroy old rendition:", error);
    }

    viewMode = mode;

    rendition = createRendition();

    if (!rendition) {
        return;
    }

    try {
        if (currentCfi) {
            await rendition.display(currentCfi);
        } else {
            await rendition.display();
        }
    } catch (error) {
        console.warn("Could not restore reading position:", error);
        await rendition.display();
    }

    syncSettingsUI();
    updateViewModeButton();
}

// Open a book from a URL or an ArrayBuffer, read its metadata and TOC, create a rendition, and display it
async function openbook(source) {
    try {
        let arrayBuffer;

        if (typeof source === "string") {
            const response = await fetch(source);
            if (!response.ok) {
                throw new Error(`Failed to fetch book: ${response.statusText}`);
            }
            arrayBuffer = await response.arrayBuffer();
        } else if (source instanceof ArrayBuffer) {
            arrayBuffer = source;
        } else {
            throw new Error("Invalid source: expected ArrayBuffer or URL string");
        }

        reader.innerHTML = "";
        book = ePub(arrayBuffer);

        const metadata = await readMetadata(book);
        bookTitle.textContent = metadata.title || "Unknown Book";

        const navigation = await book.loaded.navigation;
        toc = navigation.toc;

        console.log("EPUB TOC:", toc);

        rendition = createRendition();

        if (!rendition) {
            throw new Error("Could not create EPUB rendition");
        }

        syncSettingsUI();
        updateViewModeButton();

        await rendition.display();

        console.log("EPUB loaded");
    } catch (error) {
        console.error("Failed to load EPUB:", error);
        locationDisplay.textContent = "Failed to load EPUB";
    }
}

// Handle file input change event, delegate to openbook function with the selected file's ArrayBuffer
fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        await openbook(arrayBuffer);
    } catch (error) {
        console.error("Failed to load EPUB:", error);
        locationDisplay.textContent = "Failed to load EPUB";
    }
});

// settings panel buttons
settingsButton.addEventListener("click", () => {
    tocPanel.classList.remove("open");
    settingsPanel.classList.toggle("open");
});

closeSettingsButton.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
});

// table of contents panel buttons
tocButton.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
    tocPanel.classList.toggle("open");
});

closeTocButton.addEventListener("click", () => {
    tocPanel.classList.remove("open");
});

// view mode button; scrolled, pages
if (viewModeButton) {
    viewModeButton.addEventListener("click", async () => {
        if (!rendition) {
            return;
        }
        const newMode = viewMode === "scrolled-doc" ? "paginated" : "scrolled-doc";
        await setViewMode(newMode);
    });
}

// navigation buttons
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

// keyboard navigation
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

// file input button click event
browseBtn.addEventListener("click", () => {
    fileInput.click();
});

// Helper function to ensure that the rendition is available before executing a handler
function withRendition(handler) {
    return (...args) => {
        if (!rendition) {
            return;
        }
        handler(rendition, ...args);
    };
}

// increase font size
fontIncreaseButton?.addEventListener("click", withRendition(increaseFontSize));
// decrease font size
fontDecreaseButton?.addEventListener("click", withRendition(decreaseFontSize));
// change font family. may add customization later to allow user to add their own fonts?
fontFamilySelect?.addEventListener("change", (event) => withRendition(setFontFamily)(event.target.value));
// change line height
lineHeightSelect?.addEventListener("change", (event) => withRendition(setLineHeight)(event.target.value));
// change theme; light, dark, sepia
themeSelect?.addEventListener("change", (event) => withRendition(setTheme)(event.target.value));
// change text alignment
textAlignSelect?.addEventListener("change", (event) => withRendition(setTextAlign)(event.target.value));
// change reader width
readerWidthSelect?.addEventListener("change", (event) => withRendition(setReaderWidth)(event.target.value));
// change reader height
readerHeightSelect?.addEventListener("change", (event) => withRendition(setReaderHeight)(event.target.value));
// reset reader settings to default
resetSettingsButton?.addEventListener("click", () => {
    if (!rendition) {
        return;
    }
    resetReaderSettings(rendition);
    syncSettingsUI();
});

// Sync the settings UI with the current reader settings
function syncSettingsUI() {
    const settings = getReaderSettings();

    if (fontFamilySelect) {
        fontFamilySelect.value = settings.fontFamily;
    }
    if (lineHeightSelect) {
        lineHeightSelect.value = String(settings.lineHeight);
    }
    if (themeSelect) {
        themeSelect.value = settings.theme;
    }
    if (textAlignSelect) {
        textAlignSelect.value = settings.textAlign;
    }
    if (readerWidthSelect) {
        readerWidthSelect.value = settings.readerWidth;
    }
    if (readerHeightSelect) {
        readerHeightSelect.value = settings.readerHeight;
    }
}

enterLibraryButton?.addEventListener("click", () => {
    window.location.href = "library.html";
});

const urlParams = new URLSearchParams(window.location.search);
const bookParam = urlParams.get("book");
const userBookParam = urlParams.get("userBook");

if (bookParam) {
    fetch(`/book_samples/${encodeURIComponent(bookParam)}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch book: ${res.statusText}`);
            return res.arrayBuffer();
        })
        .then((buffer) => openbook(buffer))
        .catch((err) => {
            console.error("Failed to load book from library:", err);
            locationDisplay.textContent = "Failed to load book";
        });
} else if (userBookParam) {
    getBook(userBookParam)
        .then((stored) => {
            if (stored && stored.arrayBuffer) {
                return openbook(stored.arrayBuffer);
            }
            throw new Error("Book not found in storage");
        })
        .catch((err) => {
            console.error("Failed to load user book:", err);
            locationDisplay.textContent = "Failed to load book";
        });
}