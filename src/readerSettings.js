// readerSettings.js

const settings = {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    lineHeight: 1.6,
    theme: "light",
    textAlign: "left"
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
            background: "#ffffff",
            color: "#222222"
        },

        dark: {
            background: "#2D2D2D",
            color: "#e5e5e5"
        },

        sepia: {
            background: "#FDF6E3",
            color: "#5b4636"
        }
    };

    const theme = themes[settings.theme] || themes.light;

    rendition.themes.register("reader-settings", {
        body: {
            "font-family": `${settings.fontFamily} !important`,
            "font-size": `${settings.fontSize}px !important`,
            "line-height": `${settings.lineHeight} !important`,
            "padding-left": "0 !important",
            "padding-right": "0 !important",
            "background-color": `${theme.background} !important`,
            "color": `${theme.color} !important`,
            "text-align": `${settings.textAlign} !important`
        },

        p: {
            "font-family": `${settings.fontFamily} !important`,
            "font-size": `${settings.fontSize}px !important`,
            "line-height": `${settings.lineHeight} !important`,
            "color": `${theme.color} !important`,
            "text-align": `${settings.textAlign} !important`
        },

        div: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        span: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h1: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h2: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h3: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h4: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h5: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        h6: {
            "font-family": `${settings.fontFamily} !important`,
            "color": `${theme.color} !important`
        },

        a: {
            "color": settings.theme === "dark"
                ? "#8ab4f8 !important"
                : "#4169e1 !important"
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
    settings.fontSize += 2;

    if (settings.fontSize > 40) {
        settings.fontSize = 40;
    }

    applyReaderSettings(rendition);
}


/**
 * Decrease font size
 */
export function decreaseFontSize(rendition) {
    settings.fontSize -= 2;

    if (settings.fontSize < 10) {
        settings.fontSize = 10;
    }

    applyReaderSettings(rendition);
}


/**
 * Set font size directly
 */
export function setFontSize(rendition, size) {
    settings.fontSize = Number(size);

    if (settings.fontSize < 10) {
        settings.fontSize = 10;
    }

    if (settings.fontSize > 40) {
        settings.fontSize = 40;
    }

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
    settings.lineHeight = Number(lineHeight);

    if (settings.lineHeight < 1) {
        settings.lineHeight = 1;
    }

    if (settings.lineHeight > 3) {
        settings.lineHeight = 3;
    }

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

    applyReaderSettings(rendition);
    applyPageTheme("light");
}