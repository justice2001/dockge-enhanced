// Dayjs init inside this, so it has to be the first import
import "../../common/util-common";

import { createApp, defineComponent, h, provide, ref, watch } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { FontAwesomeIcon } from "./icon.js";
import { changeLanguage, currentLocale, i18n } from "./i18n";

// Dependencies
import "bootstrap";
import Toast, { POSITION } from "vue-toastification";
import "@xterm/xterm/lib/xterm.js";

// CSS
import "@fontsource/jetbrains-mono";
import "vue-toastification/dist/index.css";
import "@xterm/xterm/css/xterm.css";
import "./styles/main.scss";

// Minxins
import { useI18n } from "vue-i18n";
import { setPageLocale } from "./util-frontend";
import { SocketPlugin, useSocket } from "./sockets";
import {theme, THEME_INJECT_KEY} from "./theme";

// Set Title
document.title = document.title + " - " + location.host;

const app = createApp(rootApp());

app.use(Toast, {
    position: POSITION.BOTTOM_RIGHT,
    showCloseButtonOnHover: true,
});
app.use(router);
app.use(SocketPlugin);
app.use(i18n);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");

/**
 * Root Vue component
 */
function rootApp() {
    return defineComponent({
        setup() {
            const { t } = useI18n();
            const loggedIn = ref(false);
            const allowLoginDialog = ref(false);
            const username = ref(null);
            // Initialize Locale
            const locale = ref(currentLocale());
            changeLanguage(locale.value);
            provide("locale", locale);
            watch(locale, (val) => {
                changeLanguage(locale.value);
            });
            // Declare Theme
            provide(THEME_INJECT_KEY, theme());

            return { t };
        },
        render: () => h(App),
    });
}
