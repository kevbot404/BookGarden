const settings = {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    lineHeight: 1.6,
    theme: "light",
    textAlign: "left",
    readerWidth: "100%",
    readerHeight: "100%"
};


/**
 * Apply the current reader settings to epub.js
 */
export function applyReaderSettings(rendition) {
    if (!rendition) {
        return;
    }

    const themes = {
        light: {
            background: "#fefdfb",
            color: "#2d4a22"
        },

        dark: {
            background: "#2D2D2D",
            color: "#e5e5e5"
        },

        sepia: {
            background: "#fdf6e3",
            color: "#5b4636"
        }
    };

    const theme = themes[settings.theme] || themes.light;

    const linkColor = settings.theme === "dark"
        ? "#8ab4f8 !important"
        : "#4169e1 !important";

    const baseTextStyles = {
        "font-family": `${settings.fontFamily} !important`,
        "color": `${theme.color} !important`
    };

    const paragraphStyles = {
        ...baseTextStyles,
        "font-size": `${settings.fontSize}px !important`,
        "line-height": `${settings.lineHeight} !important`,
        "text-align": `${settings.textAlign} !important`
    };

    rendition.themes.register("reader-settings", {
        body: {
            ...paragraphStyles,
            "padding-left": "0 !important",
            "padding-right": "0 !important",
            "background-color": `${theme.background} !important`
        },

        p: paragraphStyles,

        div: baseTextStyles,

        span: baseTextStyles,

        h1: baseTextStyles,

        h2: baseTextStyles,

        h3: baseTextStyles,

        h4: baseTextStyles,

        h5: baseTextStyles,

        h6: baseTextStyles,

        a: {
            "color": linkColor
        },

        img: {
            "max-width": "100% !important",
            "height": "auto !important"
        }
    });

    rendition.themes.select("reader-settings");
}


/**
 * Increase font size
 */
export function increaseFontSize(rendition) {
    settings.fontSize = Math.min(settings.fontSize + 2, 40);
    applyReaderSettings(rendition);
}


/**
 * Decrease font size
 */
export function decreaseFontSize(rendition) {
    settings.fontSize = Math.max(settings.fontSize - 2, 10);
    applyReaderSettings(rendition);
}


/**
 * Set font size directly
 */
export function setFontSize(rendition, size) {
    settings.fontSize = Math.min(Math.max(Number(size), 10), 40);
    applyReaderSettings(rendition);
}


/**
 * Change font family
 */
export function setFontFamily(rendition, fontFamily) {
    settings.fontFamily = fontFamily;
    applyReaderSettings(rendition);
}


/**
 * Change line height
 */
export function setLineHeight(rendition, lineHeight) {
    settings.lineHeight = Math.min(Math.max(Number(lineHeight), 1), 3);
    applyReaderSettings(rendition);
}


/**
 * Apply a theme class to the whole page (body + html).
 */
function applyPageTheme(theme) {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove("theme-light", "theme-dark", "theme-sepia");
    body.classList.remove("theme-light", "theme-dark", "theme-sepia");

    if (theme && theme !== "light") {
        root.classList.add(`theme-${theme}`);
        body.classList.add(`theme-${theme}`);
    }
}

/**
 * Change theme
 *
 * Available:
 * - light
 * - dark
 * - sepia
 */
export function setTheme(rendition, theme) {
    if (!["light", "dark", "sepia"].includes(theme)) {
        return;
    }

    settings.theme = theme;

    applyReaderSettings(rendition);
    applyPageTheme(theme);
}


/**
 * Change text alignment
 */
export function setTextAlign(rendition, alignment) {
    if (!["left", "center", "right", "justify"].includes(alignment)) {
        return;
    }

    settings.textAlign = alignment;

    applyReaderSettings(rendition);
}


/**
 * Set reader width
 */
export function setReaderWidth(rendition, width) {
    settings.readerWidth = width;

    applyReaderSettings(rendition);
    rendition.resize(width, settings.readerHeight);
}


/**
 * Set reader height
 */
export function setReaderHeight(rendition, height) {
    settings.readerHeight = height;

    applyReaderSettings(rendition);
    rendition.resize(settings.readerWidth, height);
}


/**
 * Get current settings
 */
export function getReaderSettings() {
    return {
        ...settings
    };
}


/**
 * Reset everything to default
 */
export function resetReaderSettings(rendition) {
    settings.fontFamily = "Georgia, serif";
    settings.fontSize = 18;
    settings.lineHeight = 1.6;
    settings.theme = "light";
    settings.textAlign = "left";
    settings.readerWidth = "100%";
    settings.readerHeight = "100%";

    applyReaderSettings(rendition);
    applyPageTheme("light");
}
