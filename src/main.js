import ePub from "epubjs";
import "./style.css";

import {
    updateChapter,
    findTocEntry,
    renderToc,
    readMetadata
} from "./helpers.js";

import {
    applyReaderSettings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    setLineHeight,
    setTheme,
    setTextAlign,
    resetReaderSettings,
    getReaderSettings
} from "./readerSettings.js";


const fileInput =
    document.getElementById("epubFile");

const browseBtn =
    document.getElementById("browseBtn");

const reader =
    document.getElementById("reader");

const bookTitle =
    document.getElementById("bookTitle");


const previousButton =
    document.getElementById("previous");

const nextButton =
    document.getElementById("next");


const locationDisplay =
    document.getElementById("location");


const tocButton =
    document.getElementById("tocButton");

const closeTocButton =
    document.getElementById("closeToc");

const tocPanel =
    document.getElementById("toc");

const tocList =
    document.getElementById("tocList");


const settingsButton =
    document.getElementById("settingsButton");

const closeSettingsButton =
    document.getElementById("closeSettings");

const settingsPanel =
    document.getElementById("readerSettings");

const viewModeButton =
    document.getElementById("viewModeButton");


// Reader settings controls

const fontIncreaseButton =
    document.getElementById("fontIncrease");

const fontDecreaseButton =
    document.getElementById("fontDecrease");

const fontFamilySelect =
    document.getElementById("fontFamily");

const lineHeightSelect =
    document.getElementById("lineHeight");

const themeSelect =
    document.getElementById("theme");

const textAlignSelect =
    document.getElementById("textAlign");

const resetSettingsButton =
    document.getElementById("resetSettings");


let book = null;
let rendition = null;
let toc = [];
let viewMode = "scrolled-doc";

function createRendition() {

    if (!book) {
        return null;
    }

    reader.innerHTML = "";

    const newRendition = book.renderTo(reader, {
        width: "100%",
        height: "100%",
        flow: viewMode
    });

    applyReaderSettings(newRendition);

    newRendition.on("relocated",
        (location) => {
            const label = updateChapter(location, toc);

            if (label) {
                locationDisplay.textContent = label;
            }
        }
    );

    renderToc(
        toc,
        tocList,
        tocPanel,
        newRendition
    );

    return newRendition;
}

function updateViewModeButton() {

    if (!viewModeButton) {
        return;
    }

    if (viewMode === "scrolled-doc") {

        viewModeButton.textContent =
            "Change to Double Pages format";

        viewModeButton.title =
            "Switch to page view";

    } else {

        viewModeButton.textContent =
            "Change to Scrolled format";

        viewModeButton.title =
            "Switch to scroll view";
    }
}


async function setViewMode(mode) {

    if (!book || !rendition) {
        return;
    }

    let currentCfi = null;

    try {

        const currentLocation =
            rendition.currentLocation();

        if (
            currentLocation &&
            currentLocation.start &&
            currentLocation.start.cfi
        ) {
            currentCfi =
                currentLocation.start.cfi;
        }

    } catch (error) {

        console.warn(
            "Could not save current location:",
            error
        );
    }

    try {

        rendition.destroy();

    } catch (error) {

        console.warn(
            "Could not destroy old rendition:",
            error
        );
    }

    viewMode = mode;

    rendition = createRendition();

    if (!rendition) {
        return;
    }

    try {

        if (currentCfi) {

            await rendition.display(
                currentCfi
            );

        } else {

            await rendition.display();
        }

    } catch (error) {

        console.warn(
            "Could not restore reading position:",
            error
        );

        await rendition.display();
    }

    syncSettingsUI();
    updateViewModeButton();
}

// Handle file input change event
// When a user selects an EPUB file, read it (arrayBuffer) and render it using epub.js

fileInput.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        try {

            const arrayBuffer =
                await file.arrayBuffer();

            reader.innerHTML = "";

            book = ePub(arrayBuffer);

            const metadata = await readMetadata(book);

            bookTitle.textContent = metadata.title || "Unknown Book";

            const navigation = await book.loaded.navigation;

            toc = navigation.toc;

            console.log(
                "EPUB TOC:",
                toc
            );

            rendition = createRendition();

            if (!rendition) {
                throw new Error(
                    "Could not create EPUB rendition"
                );
            }

            syncSettingsUI();
            updateViewModeButton();

            await rendition.display();

            console.log(
                "EPUB loaded:",
                file.name
            );

        } catch (error) {

            console.error(
                "Failed to load EPUB:",
                error
            );

            locationDisplay.textContent =
                "Failed to load EPUB";
        }
    }
);

// SETTINGS PANEL

settingsButton.addEventListener(
    "click",
    () => {

        settingsPanel.classList.toggle(
            "open"
        );
    }
);


closeSettingsButton.addEventListener(
    "click",
    () => {

        settingsPanel.classList.remove(
            "open"
        );
    }
);


// TOC

tocButton.addEventListener(
    "click",
    () => {

        tocPanel.classList.toggle(
            "open"
        );
    }
);

closeTocButton.addEventListener(
    "click",
    () => {

        tocPanel.classList.remove(
            "open"
        );
    }
);

// VIEW MODE FORMAT

if (viewModeButton) {

    viewModeButton.addEventListener(
        "click",
        async () => {

            if (!rendition) {
                return;
            }

            const newMode = viewMode === "scrolled-doc" ? "paginated" : "scrolled-doc";

            await setViewMode(
                newMode
            );
        }
    );
}

// NAVIGATION BUTTONS

previousButton.addEventListener(
    "click",
    () => {

        if (!rendition) {
            return;
        }

        rendition.prev();
    }
);

nextButton.addEventListener(
    "click",
    () => {

        if (!rendition) {
            return;
        }

        rendition.next();
    }
);

// KEYBOARD NAVIGATION

document.addEventListener(
    "keydown",
    (event) => {

        if (!rendition) {
            return;
        }

        if (event.key === "ArrowLeft") {
            rendition.prev();
        }

        if (event.key === "ArrowRight") {
            rendition.next();
        }
    }
);

// FILE BROWSER

browseBtn.addEventListener(
    "click",
    () => {
        fileInput.click();
    }
);

// READER SETTINGS

if (fontIncreaseButton) {

    fontIncreaseButton.addEventListener(
        "click",
        () => {

            if (!rendition) {
                return;
            }

            increaseFontSize(
                rendition
            );
        }
    );
}

if (fontDecreaseButton) {

    fontDecreaseButton.addEventListener(
        "click",
        () => {

            if (!rendition) {
                return;
            }

            decreaseFontSize(
                rendition
            );
        }
    );
}

if (fontFamilySelect) {

    fontFamilySelect.addEventListener(
        "change",
        (event) => {

            if (!rendition) {
                return;
            }

            setFontFamily(
                rendition,
                event.target.value
            );
        }
    );
}

if (lineHeightSelect) {

    lineHeightSelect.addEventListener(
        "change",
        (event) => {

            if (!rendition) {
                return;
            }

            setLineHeight(
                rendition,
                event.target.value
            );
        }
    );
}

if (themeSelect) {

    themeSelect.addEventListener(
        "change",
        (event) => {

            if (!rendition) {
                return;
            }

            setTheme(
                rendition,
                event.target.value
            );
        }
    );
}

if (textAlignSelect) {

    textAlignSelect.addEventListener(
        "change",
        (event) => {

            if (!rendition) {
                return;
            }

            setTextAlign(
                rendition,
                event.target.value
            );
        }
    );
}

if (resetSettingsButton) {

    resetSettingsButton.addEventListener(
        "click",
        () => {

            if (!rendition) {
                return;
            }

            resetReaderSettings(
                rendition
            );

            syncSettingsUI();
        }
    );
}

export function syncSettingsUI() {

    const settings =
        getReaderSettings();


    if (fontFamilySelect) {

        fontFamilySelect.value =
            settings.fontFamily;
    }


    if (lineHeightSelect) {

        lineHeightSelect.value =
            String(
                settings.lineHeight
            );
    }


    if (themeSelect) {

        themeSelect.value =
            settings.theme;
    }


    if (textAlignSelect) {

        textAlignSelect.value =
            settings.textAlign;
    }
}
