
const root = document.documentElement;

function setTheme(theme) {
    const isDark = theme === "dark";

    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);

    document.querySelectorAll(".mode-icon")
        .forEach(icon => icon.textContent = isDark ? "light_mode" : "dark_mode");
}

function savedTheme() {
    return localStorage.getItem("theme") || "light";
}

setTheme(savedTheme());

function toggleTheme() {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
}

document.querySelectorAll(".theme-btn")
    .forEach(btn => btn.addEventListener("click", toggleTheme));