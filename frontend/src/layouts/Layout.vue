<template>
    <div :class="classes">
        <div v-if="! socket.socketIO.value.connected && ! socket.socketIO.value.firstConnect" class="lost-connection">
            <div class="container-fluid">
                {{ socket.socketIO.value.connectionErrorMsg }}
                <div v-if="socket.socketIO.value.showReverseProxyGuide">
                    {{ t("reverseProxyMsg1") }} <a href="https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy" target="_blank">{{ t("reverseProxyMsg2") }}</a>
                </div>
            </div>
        </div>

        <!-- Desktop header -->
        <header v-if="true || ! $root.isMobile" class="d-flex flex-wrap justify-content-center py-3 mb-3 border-bottom">
            <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-dark text-decoration-none">
                <object class="bi me-2 ms-4" width="40" height="40" data="/icon.svg" />
                <span class="fs-4 title">Dockge</span>
            </router-link>

            <a v-if="hasNewVersion" target="_blank" href="https://github.com/louislam/dockge/releases" class="btn btn-warning me-3">
                <font-awesome-icon icon="arrow-alt-circle-up" /> {{ t("newUpdate") }}
            </a>

            <ul class="nav nav-pills">
                <li v-if="socket.loggedIn" class="nav-item me-2">
                    <router-link to="/" class="nav-link">
                        <font-awesome-icon icon="home" /> {{ t("home") }}
                    </router-link>
                </li>

                <li v-if="socket.loggedIn" class="nav-item me-2">
                    <router-link to="/console" class="nav-link">
                        <font-awesome-icon icon="terminal" /> {{ t("console") }}
                    </router-link>
                </li>

                <li v-if="socket.loggedIn" class="nav-item">
                    <div class="dropdown dropdown-profile-pic">
                        <div class="nav-link" data-bs-toggle="dropdown">
                            <div class="profile-pic">{{ socket.usernameFirstChar }}</div>
                            <font-awesome-icon icon="angle-down" />
                        </div>

                        <!-- Header's Dropdown Menu -->
                        <ul class="dropdown-menu">
                            <!-- Username -->
                            <li>
                                <i18n-t v-if="socket.username != null" tag="span" keypath="signedInDisp" class="dropdown-item-text">
                                    <strong>{{ socket.username }}</strong>
                                </i18n-t>
                                <span v-if="socket.username == null" class="dropdown-item-text">{{ t("signedInDispDisabled") }}</span>
                            </li>

                            <li><hr class="dropdown-divider"></li>

                            <!-- Functions -->

                            <!--<li>
                                <router-link to="/registry" class="dropdown-item" :class="{ active: $route.path.includes('settings') }">
                                    <font-awesome-icon icon="warehouse" /> {{ t("registry") }}
                                </router-link>
                            </li>-->

                            <li>
                                <button class="dropdown-item" @click="scanFolder">
                                    <font-awesome-icon icon="arrows-rotate" /> {{ t("scanFolder") }}
                                </button>
                            </li>

                            <li>
                                <router-link to="/settings/general" class="dropdown-item" :class="{ active: $route.path.includes('settings') }">
                                    <font-awesome-icon icon="cog" /> {{ t("Settings") }}
                                </router-link>
                            </li>

                            <li>
                                <button class="dropdown-item" @click="socket.logout">
                                    <font-awesome-icon icon="sign-out-alt" />
                                    {{ t("Logout") }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </li>
            </ul>
        </header>

        <main>
            <div v-if="socket.socketIO.value.connecting" class="container mt-5">
                <h4>{{ t("connecting...") }}</h4>
            </div>

            <router-view v-if="socket.loggedIn" />
            <Login v-if="! socket.loggedIn && socket.allowLoginDialog" />
        </main>
    </div>
</template>

<script setup>
import Login from "../components/Login.vue";
import { useSocket } from "../sockets";
import { useI18n } from "vue-i18n";
import { computed, onMounted } from "vue";
import { compareVersions } from "compare-versions";
import { toastRes } from "../toast";
import { useTheme } from "../theme";
import { ALL_ENDPOINTS } from "../../../common/util-common";
const socket = useSocket();
const theme = useTheme();
const { t } = useI18n();

// Theme or Mobile
const classes = computed(() => {
    const classes = {};
    classes[theme.theme.value] = true;
    // classes["mobile"] = this.$root.isMobile;
    return classes;
});

const hasNewVersion = computed(() => {
    if (socket.info.value.latestVersion && socket.info.value.version) {
        return compareVersions(socket.info.value.latestVersion, socket.info.value.version) >= 1;
    } else {
        return false;
    }
});
const scanFolder = () => {
    socket.emitAgent(ALL_ENDPOINTS, "requestStackList", (res) => {
        toastRes(res);
    });
};

onMounted(() => {
    console.log(socket.socketIO.value);
});
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.nav-link {
    &.status-page {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

.bottom-nav {
    z-index: 1000;
    position: fixed;
    bottom: 0;
    height: calc(60px + env(safe-area-inset-bottom));
    width: 100%;
    left: 0;
    background-color: #fff;
    box-shadow: 0 15px 47px 0 rgba(0, 0, 0, 0.05), 0 5px 14px 0 rgba(0, 0, 0, 0.05);
    text-align: center;
    white-space: nowrap;
    padding: 0 10px env(safe-area-inset-bottom);

    a {
        text-align: center;
        width: 25%;
        display: inline-block;
        height: 100%;
        padding: 8px 10px 0;
        font-size: 13px;
        color: #c1c1c1;
        overflow: hidden;
        text-decoration: none;

        &.router-link-exact-active, &.active {
            color: $primary;
            font-weight: bold;
        }

        div {
            font-size: 20px;
        }
    }
}

main {
    min-height: calc(100vh - 160px);
}

.title {
    font-weight: bold;
}

.nav {
    margin-right: 25px;
}

.lost-connection {
    padding: 5px;
    background-color: crimson;
    color: white;
    position: fixed;
    width: 100%;
    z-index: 99999;
}

// Profile Pic Button with Dropdown
.dropdown-profile-pic {
    user-select: none;

    .nav-link {
        cursor: pointer;
        display: flex;
        gap: 6px;
        align-items: center;
        background-color: rgba(200, 200, 200, 0.2);
        padding: 0.5rem 0.8rem;

        &:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
    }

    .dropdown-menu {
        transition: all 0.2s;
        padding-left: 0;
        padding-bottom: 0;
        margin-top: 8px !important;
        border-radius: 16px;
        overflow: hidden;

        .dropdown-divider {
            margin: 0;
            border-top: 1px solid rgba(0, 0, 0, 0.4);
            background-color: transparent;
        }

        .dropdown-item-text {
            font-size: 14px;
            padding-bottom: 0.7rem;
        }

        .dropdown-item {
            padding: 0.7rem 1rem;
        }

        .dark & {
            background-color: $dark-bg;
            color: $dark-font-color;
            border-color: $dark-border-color;

            .dropdown-item {
                color: $dark-font-color;

                &.active {
                    color: $dark-font-color2;
                    background-color: $highlight !important;
                }

                &:hover {
                    background-color: $dark-bg2;
                }
            }
        }
    }

    .profile-pic {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background-color: $primary;
        width: 24px;
        height: 24px;
        margin-right: 5px;
        border-radius: 50rem;
        font-weight: bold;
        font-size: 10px;
    }
}

.dark {
    header {
        background-color: $dark-header-bg;
        border-bottom-color: $dark-header-bg !important;

        span {
            color: #f0f6fc;
        }
    }

    .bottom-nav {
        background-color: $dark-bg;
    }
}
</style>
