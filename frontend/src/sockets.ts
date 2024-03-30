import {App, computed, ComputedRef, getCurrentInstance, inject, Ref, ref, watch} from "vue";
import { useI18n } from "vue-i18n";
import { io } from "socket.io-client";
import { AgentSocket } from "../../common/agent-socket";
import jwtDecode from "jwt-decode";
import { Terminal } from "@xterm/xterm";
import { useRouter } from "vue-router";
import { toastError, toastRes } from "./toast";
import { i18n } from "./i18n";

let socket : Socket;

let terminalMap : Map<string, Terminal> = new Map();

export const SocketPlugin = {
    install(app: App) {
        app.provide("socket", Socket());
    }
};

export const Socket = () => {
    const { t } = i18n.global;
    const socketIO = ref({
        token: null,
        firstConnect: true,
        connected: false,
        connectCount: 0,
        initedSocketIO: false,
        connectionErrorMsg: `${t("Cannot connect to the socket server.")} ${t("Reconnecting...")}`,
        showReverseProxyGuide: true,
        connecting: false,
    });
    const info = ref({});
    const remember = ref(localStorage.remember !== "0");
    const loggedIn = ref(false);
    const allowLoginDialog = ref(false);
    const username = ref(null);
    const composeTemplate = ref("");
    const stackList = ref<Record<string, object>>({});
    // All stack list from all agents
    const allAgentStackList = ref<Record<string, object>>({});
    // online / offline / connecting
    const agentStatusList = ref<Record<string, string>>({});
    // Agent List
    const agentList = ref<Record<string, object>>({});

    /** COMPUTE **/
    const agentCount = computed(() => {
        return Object.keys(agentList.value).length;
    });

    const completeStackList = computed(() => {
        let list: Record<string, object> = {};

        for (let stackName in stackList.value) {
            list[stackName + "_"] = stackList.value[stackName];
        }

        for (let endpoint in allAgentStackList.value) {
            let instance = allAgentStackList.value[endpoint];
            for (let stackName in instance.stackList) {
                list[stackName + "_" + endpoint] = instance.stackList[stackName];
            }
        }
        return list;
    });

    const usernameFirstChar = computed(() => {
        if (typeof username.value == "string" && username.value.length >= 1) {
            return username.value.charAt(0).toUpperCase();
        } else {
            return "🐬";
        }
    });

    /**
     *  Frontend Version
     *  It should be compiled to a static value while building the frontend.
     *  Please see ./frontend/vite.config.ts, it is defined via vite.js
     * @returns {string}
     */
    const frontendVersion = computed(() => {
        // eslint-disable-next-line no-undef
        return FRONTEND_VERSION;
    });

    /**
     * Are both frontend and backend in the same version?
     * @returns {boolean}
     */
    const isFrontendBackendVersionMatched = computed(() => {
        if (!info.value.version) {
            return true;
        }
        return info.value.version === frontendVersion.value;
    });

    // WATCH

    watch(() => socketIO.value.connected, () => {
        if (socketIO.value.connected) {
            agentStatusList.value[""] = "online";
        } else {
            agentStatusList.value[""] = "offline";
        }
    });

    watch(remember, () => {
        localStorage.remember = (remember.value) ? "1" : "0";
    });

    watch(() => info.value.version, (to, from) => {
        if (from && from !== to) {
            window.location.reload();
        }
    });

    const endpointDisplayFunction = (endpoint : string) => {
        if (endpoint) {
            return endpoint;
        } else {
            return t("currentEndpoint");
        }
    };

    /**
     * Initialize connection to socket server
     * @param bypass Should the check for if we
     * are on a status page be bypassed?
     */
    const initSocketIO = (bypass = false) => {
        // No need to re-init
        if (socketIO.value.initedSocketIO) {
            return;
        }

        socketIO.value.initedSocketIO = true;
        let url : string;
        const env = process.env.NODE_ENV || "production";
        if (env === "development" || localStorage.dev === "dev") {
            url = location.protocol + "//" + location.hostname + ":5001";
        } else {
            url = location.protocol + "//" + location.host;
        }

        let connectingMsgTimeout = setTimeout(() => {
            socketIO.value.connecting = true;
        }, 1500);

        socket = io(url);

        // Handling events from agents
        let agentSocket = new AgentSocket();
        socket.on("agent", (eventName : unknown, ...args : unknown[]) => {
            agentSocket.call(eventName, ...args);
        });

        socket.on("connect", () => {
            console.log("Connected to the socket server");

            clearTimeout(connectingMsgTimeout);
            socketIO.value.connecting = false;
            socketIO.value.connectCount++;
            socketIO.value.connected = true;
            socketIO.value.showReverseProxyGuide = false;
            const token = storage().token;

            if (token) {
                if (token !== "autoLogin") {
                    console.log("Logging in by token");
                    loginByToken(token);
                } else {
                    // Timeout if it is not actually auto login
                    setTimeout(() => {
                        if (! loggedIn.value) {
                            allowLoginDialog.value = true;
                            storage().removeItem("token");
                        }
                    }, 5000);
                }
            } else {
                allowLoginDialog.value = true;
            }

            socketIO.value.firstConnect = false;
        });

        socket.on("disconnect", () => {
            console.log("disconnect");
            socketIO.value.connectionErrorMsg = "Lost connection to the socket server. Reconnecting...";
            socketIO.value.connected = false;
        });

        socket.on("connect_error", (err) => {
            console.error(`Failed to connect to the backend. Socket.io connect_error: ${err.message}`);
            socketIO.value.connectionErrorMsg = `${t("Cannot connect to the socket server.")} [${err}] ${t("reconnecting...")}`;
            socketIO.value.showReverseProxyGuide = true;
            socketIO.value.connected = false;
            socketIO.value.firstConnect = false;
            socketIO.value.connecting = false;
        });

        // Custom Events

        socket.on("info", (i) => {
            info.value = i;
        });

        socket.on("autoLogin", () => {
            loggedIn.value = true;
            storage().token = "autoLogin";
            socketIO.value.token = "autoLogin";
            allowLoginDialog.value = false;
            afterLogin();
        });

        socket.on("setup", () => {
            console.log("setup");
            useRouter().push("/setup");
        });

        agentSocket.on("terminalWrite", (terminalName, data) => {
            const terminal = terminalMap.get(terminalName);
            if (!terminal) {
                //console.error("Terminal not found: " + terminalName);
                return;
            }
            terminal.write(data);
        });

        agentSocket.on("stackList", (res) => {
            if (res.ok) {
                if (!res.endpoint) {
                    stackList.value = res.stackList;
                } else {
                    if (!allAgentStackList.value[res.endpoint]) {
                        allAgentStackList.value[res.endpoint] = {
                            stackList: {},
                        };
                    }
                    allAgentStackList.value[res.endpoint].stackList = res.stackList;
                }
            }
        });

        socket.on("stackStatusList", (res) => {
            if (res.ok) {
                for (let stackName in res.stackStatusList) {
                    const stackObj = stackList.value[stackName];
                    if (stackObj) {
                        stackObj.status = res.stackStatusList[stackName];
                    }
                }
            }
        });

        socket.on("agentStatus", (res) => {
            agentStatusList.value[res.endpoint] = res.status;

            if (res.msg) {
                toastError(res.msg);
            }
        });

        socket.on("agentList", (res) => {
            console.log(res);
            if (res.ok) {
                agentList.value = res.agentList;
            }
        });

        socket.on("refresh", () => {
            location.reload();
        });
    };

    /**
     * The storage currently in use
     * @returns Current storage
     */
    const storage = () : Storage => {
        return (remember.value) ? localStorage : sessionStorage;
    };

    const getSocket = () : Socket => {
        return socket;
    };

    const emitAgent = (endpoint : string, eventName : string, ...args : unknown[]) => {
        getSocket().emit("agent", endpoint, eventName, ...args);
    };

    /**
     * Get payload of JWT cookie
     * @returns {(object | undefined)} JWT payload
     */
    const getJWTPayload = () => {
        const jwtToken = storage().token;

        if (jwtToken && jwtToken !== "autoLogin") {
            return jwtDecode(jwtToken);
        }
        return undefined;
    };

    /**
     * Send request to log user in
     * @param {string} username Username to log in with
     * @param {string} password Password to log in with
     * @param {string} token User token
     * @param {loginCB} callback Callback to call with result
     * @returns {void}
     */
    const login = (username : string, password : string, token : string, callback) => {
        getSocket().emit("login", {
            username,
            password,
            token,
        }, (res) => {
            if (res.tokenRequired) {
                callback(res);
            }

            if (res.ok) {
                storage().token = res.token;
                socketIO.value.token = res.token;
                loggedIn.value = true;
                username = getJWTPayload()?.username;
                afterLogin();

                // Trigger Chrome Save Password
                history.pushState({}, "");
            }

            callback(res);
        });
    };

    /**
     * Log in using a token
     * @param {string} token Token to log in with
     * @returns {void}
     */
    const loginByToken = (token : string) => {
        socket.emit("loginByToken", token, (res) => {
            allowLoginDialog.value = true;

            if (!res.ok) {
                logout();
            } else {
                loggedIn.value = true;
                username.value = getJWTPayload()?.username;
                afterLogin();
            }
        });
    };

    /**
     * Log out of the web application
     */
    const logout = () => {
        socket.emit("logout", () => { });
        storage().removeItem("token");
        socketIO.value.token = null;
        loggedIn.value = false;
        username.value = null;
        clearData();
    };

    const clearData = () => {};

    const afterLogin = () => {};

    const bindTerminal = (endpoint : string, terminalName : string, terminal : Terminal) => {
        // Load terminal, get terminal screen
        emitAgent(endpoint, "terminalJoin", terminalName, (res) => {
            if (res.ok) {
                terminal.write(res.buffer);
                terminalMap.set(terminalName, terminal);
            } else {
                toastRes(res);
            }
        });
    };

    const unbindTerminal = (terminalName : string) => {
        terminalMap.delete(terminalName);
    };

    initSocketIO();

    return {
        socketIO,
        loggedIn,
        username,
        composeTemplate,
        allowLoginDialog,
        usernameFirstChar,
        completeStackList,
        stackList,
        agentCount,
        allAgentStackList,
        info,
        getSocket,
        logout,
        emitAgent
    };

};

export const useSocket = (): ReturnType<typeof Socket> => inject("socket") as ReturnType<typeof Socket>;
