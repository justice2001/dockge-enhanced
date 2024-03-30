import {computed, inject, onMounted, ref, watch} from "vue";
import { useRoute } from "vue-router";

export declare type SystemTheme = "dark" | "light" | "auto"

export const THEME_INJECT_KEY = "theme";

export const theme = () => {
    const system = ref<SystemTheme>((window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
    const userTheme = ref<SystemTheme>(localStorage.theme);
    const statusPageTheme = ref<SystemTheme>("light");
    const forceStatusPageTheme = ref<boolean>(false);
    const path = ref<string>("");

    const theme = computed(() => {
        if (userTheme.value === "auto") {
            return system.value;
        }
        return userTheme.value;
    });

    const isDark = computed(() => {
        return theme.value === "dark";
    });

    const updateThemeColorMeta = () => {
        if (theme.value === "dark") {
            document.querySelector("#theme-color")?.setAttribute("content", "#161B22");
        } else {
            document.querySelector("#theme-color")?.setAttribute("content", "#5cdd8b");
        }
    };

    watch(() => useRoute()?.fullPath, (routePath) => {
        path.value = routePath;
    });

    watch(userTheme, (val) => {
        localStorage.theme = val;
    });

    watch(theme, (to, from) => {
        document.body.classList.remove(from);
        document.body.classList.add(theme.value);
        updateThemeColorMeta();
    });

    onMounted(() => {
        if (! userTheme.value) {
            userTheme.value = "dark";
        }

        document.body.classList.add(theme.value);
        updateThemeColorMeta();
    });

    return {
        system,
        userTheme,
        statusPageTheme,
        forceStatusPageTheme,
        path,
        theme,
        isDark,
        updateThemeColorMeta
    };
};

export const useTheme = (): ReturnType<typeof theme> => inject(THEME_INJECT_KEY) as ReturnType<typeof theme>;
