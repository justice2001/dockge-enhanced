<template>
    <transition ref="tableContainer" name="slide-fade" appear>
        <div v-if="$route.name === 'DashboardHome'">
            <h1 class="mb-3">
                {{ t("home") }}
            </h1>

            <div class="row first-row">
                <!-- Left -->
                <div class="col-md-7">
                    <!-- Stats -->
                    <div class="shadow-box big-padding text-center mb-4">
                        <div class="row">
                            <div class="col">
                                <h3>{{ t("active") }}</h3>
                                <span class="num active">{{ activeNum }}</span>
                            </div>
                            <div class="col">
                                <h3>{{ t("exited") }}</h3>
                                <span class="num exited">{{ exitedNum }}</span>
                            </div>
                            <div class="col">
                                <h3>{{ t("inactive") }}</h3>
                                <span class="num inactive">{{ inactiveNum }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Docker Run -->
                    <h2 class="mb-3">{{ t("Docker Run") }}</h2>
                    <div class="mb-3">
                        <textarea id="name" v-model="dockerRunCommand" type="text" class="form-control docker-run" required placeholder="docker run ..."></textarea>
                    </div>

                    <button class="btn-normal btn mb-4" @click="convertDockerRun">{{ t("Convert to Compose") }}</button>
                </div>
                <!-- Right -->
                <div class="col-md-5">
                    <!-- Agent List -->
                    <div class="shadow-box big-padding">
                        <h4 class="mb-3">{{ t("dockgeAgent", 2) }} <span class="badge bg-warning" style="font-size: 12px;">beta</span></h4>

                        <div v-for="(agent, endpoint) in $root.agentList" :key="endpoint" class="mb-3 agent">
                            <!-- Agent Status -->
                            <template v-if="$root.agentStatusList[endpoint]">
                                <span v-if="$root.agentStatusList[endpoint] === 'online'" class="badge bg-primary me-2">{{ t("agentOnline") }}</span>
                                <span v-else-if="$root.agentStatusList[endpoint] === 'offline'" class="badge bg-danger me-2">{{ t("agentOffline") }}</span>
                                <span v-else class="badge bg-secondary me-2">{{ t($root.agentStatusList[endpoint]) }}</span>
                            </template>

                            <!-- Agent Display Name -->
                            <span v-if="endpoint === ''">{{ t("currentEndpoint") }}</span>
                            <a v-else :href="agent.url" target="_blank">{{ endpoint }}</a>

                            <!-- Remove Button -->
                            <font-awesome-icon v-if="endpoint !== ''" class="ms-2 remove-agent" icon="trash" @click="showRemoveAgentDialog[agent.url] = !showRemoveAgentDialog[agent.url]" />

                            <!-- Remoe Agent Dialog -->
                            <BModal v-model="showRemoveAgentDialog[agent.url]" :okTitle="t('removeAgent')" okVariant="danger" @ok="removeAgent(agent.url)">
                                <p>{{ agent.url }}</p>
                                {{ t("removeAgentMsg") }}
                            </BModal>
                        </div>

                        <button v-if="!showAgentForm" class="btn btn-normal" @click="showAgentForm = !showAgentForm">{{ t("addAgent") }}</button>

                        <!-- Add Agent Form -->
                        <form v-if="showAgentForm" @submit.prevent="addAgent">
                            <div class="mb-3">
                                <label for="url" class="form-label">{{ t("dockgeURL") }}</label>
                                <input id="url" v-model="agent.url" type="url" class="form-control" required placeholder="http://">
                            </div>

                            <div class="mb-3">
                                <label for="username" class="form-label">{{ t("Username") }}</label>
                                <input id="username" v-model="agent.username" type="text" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">{{ t("Password") }}</label>
                                <input id="password" v-model="agent.password" type="password" class="form-control" required autocomplete="new-password">
                            </div>

                            <button type="submit" class="btn btn-primary" :disabled="connectingAgent">
                                <template v-if="connectingAgent">{{ t("connecting") }}</template>
                                <template v-else>{{ t("connect") }}</template>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </transition>
    <router-view ref="child" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useSocket} from "../sockets";
import {toastRes} from "../toast";
import {useRouter} from "vue-router";
import {statusNameShort} from "../../../common/util-common";
const { t } = useI18n();
const socket = useSocket();
const router = useRouter();

withDefaults(defineProps<{
    type: number
}>(), {
    type: 0
});

const tableContainer = ref();

const page = ref<number>(1);
const perPage = ref<number>(25);
const initialPerPage = ref<number>(25);
const paginationConfig = ref({
    hideCount: true,
    chunksNavigation: "scroll",
});
const importantHeartBeatListLength = ref(0);
const displayedRecords = ref([]);
const dockerRunCommand = ref("");
const showAgentForm = ref(false);
const showRemoveAgentDialog = ref({});
const connectingAgent = ref(false);
const agent = ref({
    url: "http://",
    username: "",
    password: "",
});
const activeNum = computed(() => {
    return getStatusNum("active");
});

const inactiveNum = computed(() => {
    return getStatusNum("inactive");
});

const exitedNum = computed(() => {
    return getStatusNum("exited");
});

watch(perPage, () => {
    nextTick(() => {
        getImportantHeartbeatListPaged();
    });
});

watch(page, () => {
    getImportantHeartbeatListPaged();
});

onMounted(() => {
    initialPerPage.value = perPage.value;

    window.addEventListener("resize", updatePerPage);
    updatePerPage();
});
onBeforeUnmount(() => {
    window.removeEventListener("resize", updatePerPage);
});

const addAgent = () => {
    connectingAgent.value = true;
    socket.getSocket().emit("addAgent", agent.value, (res) => {
        toastRes(res);

        if (res.ok) {
            showAgentForm.value = false;
            agent.value = {
                url: "http://",
                username: "",
                password: "",
            };
        }

        connectingAgent.value = false;
    });
};

const removeAgent = (url: string) => {
    socket.getSocket().emit("removeAgent", url, (res) => {
        if (res.ok) {
            toastRes(res);

            let urlObj = new URL(url);
            let endpoint = urlObj.host;

            // Remove the stack list and status list of the removed agent
            delete socket.allAgentStackList.value[endpoint];
        }
    });
};

const getStatusNum = (statusName: string) => {
    let num = 0;

    for (let stackName in socket.completeStackList.value) {
        const stack = socket.completeStackList.value[stackName];
        if (statusNameShort(stack.status) === statusName) {
            num += 1;
        }
    }
    return num;
};

const convertDockerRun = () => {
    if (dockerRunCommand.value.trim() === "docker run") {
        throw new Error("Please enter a docker run command");
    }

    // composerize is working in dev, but after "vite build", it is not working
    // So pass to backend to do the conversion
    socket.getSocket().emit("composerize", dockerRunCommand.value, (res) => {
        if (res.ok) {
            socket.composeTemplate = res.composeTemplate;
            router.push("/compose");
        } else {
            toastRes(res);
        }
    });
};

/**
 * Updates the displayed records when a new important heartbeat arrives.
 * @param {object} heartbeat - The heartbeat object received.
 * @returns {void}
 */
const onNewImportantHeartbeat = (heartbeat: object): void => {
    if (page.value === 1) {
        displayedRecords.value.unshift(heartbeat);
        if (displayedRecords.value.length > perPage.value) {
            displayedRecords.value.pop();
        }
        importantHeartBeatListLength.value += 1;
    }
};

/**
 * Retrieves the length of the important heartbeat list for all monitors.
 * @returns {void}
 */
const getImportantHeartbeatListLength = (): void => {
    socket.getSocket().emit("monitorImportantHeartbeatListCount", null, (res) => {
        if (res.ok) {
            importantHeartBeatListLength.value = res.count;
            getImportantHeartbeatListPaged();
        }
    });
};

/**
 * Retrieves the important heartbeat list for the current page.
 * @returns {void}
 */
const getImportantHeartbeatListPaged = (): void => {
    const offset = (page.value - 1) * perPage.value;
    socket.getSocket().emit("monitorImportantHeartbeatListPaged", null, offset, perPage.value, (res) => {
        if (res.ok) {
            displayedRecords.value = res.data;
        }
    });
};

/**
 * Updates the number of items shown per page based on the available height.
 * @returns {void}
 */
const updatePerPage = (): void => {
    const tableContainerHeight = tableContainer.value?.offsetHeight;
    const availableHeight = window.innerHeight - tableContainerHeight;
    const additionalPerPage = Math.floor(availableHeight / 58);

    if (additionalPerPage > 0) {
        perPage.value = Math.max(initialPerPage.value, perPage.value + additionalPerPage);
    } else {
        perPage.value = initialPerPage.value;
    }
};
</script>

<style lang="scss" scoped>
@import "../styles/vars";

.num {
    font-size: 30px;

    font-weight: bold;
    display: block;

    &.active {
        color: $primary;
    }

    &.exited {
        color: $danger;
    }
}

.shadow-box {
    padding: 20px;
}

table {
    font-size: 14px;

    tr {
        transition: all ease-in-out 0.2ms;
    }

    @media (max-width: 550px) {
        table-layout: fixed;
        overflow-wrap: break-word;
    }
}

.docker-run {
    background-color: $dark-bg !important;
    border: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
}

.first-row .shadow-box {

}

.remove-agent {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.3);
}

.agent {
    a {
        text-decoration: none;
    }
}

</style>
