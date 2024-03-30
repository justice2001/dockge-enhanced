<template>
    <transition name="slide-fade" appear>
        <div>
            <h1 v-if="isAdd" class="mb-3">Compose</h1>
            <h1 v-else class="mb-3">
                <Uptime :stack="globalStack" :pill="true" /> {{ stack?.name }}
                <span v-if="socket.agentCount.value > 1" class="agent-name">
                    ({{ endpointDisplay }})
                </span>
            </h1>

            <div v-if="stack?.isManagedByDockge" class="mb-3">
                <div class="btn-group me-2" role="group">
                    <button v-if="isEditMode" class="btn btn-primary" :disabled="processing" @click="deployStack">
                        <font-awesome-icon icon="rocket" class="me-1" />
                        {{ t("deployStack") }}
                    </button>

                    <button v-if="isEditMode" class="btn btn-normal" :disabled="processing" @click="saveStack">
                        <font-awesome-icon icon="save" class="me-1" />
                        {{ t("saveStackDraft") }}
                    </button>

                    <button v-if="!isEditMode" class="btn btn-secondary" :disabled="processing" @click="enableEditMode">
                        <font-awesome-icon icon="pen" class="me-1" />
                        {{ t("editStack") }}
                    </button>

                    <button v-if="!isEditMode && !active" class="btn btn-primary" :disabled="processing" @click="startStack">
                        <font-awesome-icon icon="play" class="me-1" />
                        {{ t("startStack") }}
                    </button>

                    <button v-if="!isEditMode && active" class="btn btn-normal " :disabled="processing" @click="restartStack">
                        <font-awesome-icon icon="rotate" class="me-1" />
                        {{ t("restartStack") }}
                    </button>

                    <button v-if="!isEditMode" class="btn btn-normal" :disabled="processing" @click="updateStack">
                        <font-awesome-icon icon="cloud-arrow-down" class="me-1" />
                        {{ t("updateStack") }}
                    </button>

                    <button v-if="!isEditMode && active" class="btn btn-normal" :disabled="processing" @click="stopStack">
                        <font-awesome-icon icon="stop" class="me-1" />
                        {{ t("stopStack") }}
                    </button>

                    <RouterLink class="btn btn-normal" :to="filesLink">
                        <font-awesome-icon icon="folder" class="me-1" />
                        {{ t("manageData") }}
                    </RouterLink>

                    <BDropdown right text="" variant="normal">
                        <BDropdownItem @click="downStack">
                            <font-awesome-icon icon="stop" class="me-1" />
                            {{ t("downStack") }}
                        </BDropdownItem>
                    </BDropdown>
                </div>

                <button v-if="isEditMode && !isAdd" class="btn btn-normal" :disabled="processing" @click="discardStack">{{ t("discardStack") }}</button>
                <button v-if="!isEditMode" class="btn btn-danger" :disabled="processing" @click="showDeleteDialog = !showDeleteDialog">
                    <font-awesome-icon icon="trash" class="me-1" />
                    {{ t("deleteStack") }}
                </button>
            </div>

            <!-- URLs -->
            <div v-if="urls.length > 0" class="mb-3">
                <a v-for="(url, index) in urls" :key="index" target="_blank" :href="url.url">
                    <span class="badge bg-secondary me-2">{{ url.display }}</span>
                </a>
            </div>

            <!-- Progress Terminal -->
            <transition name="slide-fade" appear>
                <Terminal
                    v-show="showProgressTerminal"
                    ref="progressTerminal"
                    class="mb-3 terminal"
                    :name="terminalName"
                    :endpoint="endpoint"
                    :rows="progressTerminalRows"
                    @has-data="showProgressTerminal = true; submitted = true;"
                ></Terminal>
            </transition>

            <div v-if="stack?.isManagedByDockge" v-show="!isEditMode">
                <h4 class="mb-3">Terminal</h4>
                <Terminal
                    ref="combinedTerminal"
                    class="mb-3 terminal"
                    :name="combinedTerminalName"
                    :endpoint="endpoint"
                    :rows="combinedTerminalRows"
                    :cols="combinedTerminalCols"
                    style="height: 350px;"
                ></Terminal>
            </div>

            <div v-if="stack?.isManagedByDockge" class="row">
                <div class="col-lg-6">
                    <!-- General -->
                    <div v-if="isAdd">
                        <h4 class="mb-3">{{ t("general") }}</h4>
                        <div class="shadow-box big-padding mb-3">
                            <!-- Stack Name -->
                            <div>
                                <label for="name" class="form-label">{{ t("stackName") }}</label>
                                <input id="name" v-model="stack.name" type="text" class="form-control" required @blur="stackNameToLowercase">
                                <div class="form-text">{{ t("Lowercase only") }}</div>
                            </div>

                            <!-- Endpoint -->
                            <div class="mt-3">
                                <label for="name" class="form-label">{{ t("dockgeAgent") }}</label>
                                <select v-model="stack.endpoint" class="form-select">
                                    <option v-for="(agent, endpoint) in socket.agentList.value" :key="endpoint" :value="endpoint"
                                            :disabled="socket.agentStatusList.value[endpoint] != 'online'">
                                        ({{ socket.agentStatusList.value[endpoint] }}) {{ (endpoint) ? endpoint : t("currentEndpoint") }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Containers -->
                    <h4 class="mb-3">{{ t("container", 2) }}</h4>

                    <div v-if="isEditMode" class="input-group mb-3">
                        <input
                            v-model="newContainerName"
                            placeholder="New Container Name..."
                            class="form-control"
                            @keyup.enter="addContainer"
                        />
                        <button class="btn btn-primary" @click="addContainer">
                            {{ t("addContainer") }}
                        </button>
                    </div>

                    <div ref="containerList">
                        <Container
                            v-for="(service, name) in jsonConfig.services"
                            :key="name"
                            :name="name"
                            :is-edit-mode="isEditMode"
                            :first="name === Object.keys(jsonConfig?.services)[0]"
                            :status="serviceStatusList[name]"
                        />
                    </div>

                    <button v-if="isEditMode && jsonConfig.services && Object.keys(jsonConfig.services).length > 0" class="btn btn-normal mb-3" @click="addContainer">{{ t("addContainer") }}</button>

                    <!-- General -->
                    <div v-if="isEditMode">
                        <h4 class="mb-3">{{ t("extra") }}</h4>
                        <div class="shadow-box big-padding mb-3">
                            <!-- URLs -->
                            <div class="mb-4">
                                <label class="form-label">
                                    {{ t("url", 2) }}
                                </label>
                                <ArrayInput name="urls" :display-name="t('url')" placeholder="https://" object-type="x-dockge" />
                            </div>
                        </div>

                        <div class="shadow-box big-padding mb-3">
                            <!-- URLs -->
                            <div class="mb-4">
                                <label class="form-label">
                                    {{ t("tags", 2) }}
                                </label>
                                <ArrayInput name="tags" :display-name="t('tag')" placeholder="Tag Name" object-type="x-dockge" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <h4 class="mb-3">{{ stack?.composeFileName }}</h4>

                    <!-- YAML editor -->
                    <div class="shadow-box mb-3 editor-box" :class="{'edit-mode' : isEditMode}">
                        <prism-editor
                            ref="editor"
                            v-model="stack.composeYAML"
                            class="yaml-editor"
                            :highlight="highlighterYAML"
                            line-numbers :readonly="!isEditMode"
                            @input="yamlCodeChange"
                            @focus="editorFocus = true"
                            @blur="editorFocus = false"
                        ></prism-editor>
                    </div>
                    <div v-if="isEditMode" class="mb-3">
                        {{ yamlError }}
                    </div>

                    <!-- ENV editor -->
                    <div v-if="isEditMode">
                        <h4 class="mb-3">.env</h4>
                        <div class="shadow-box mb-3 editor-box" :class="{'edit-mode' : isEditMode}">
                            <prism-editor
                                ref="editor"
                                v-model="stack.composeENV"
                                class="env-editor"
                                :highlight="highlighterENV"
                                line-numbers :readonly="!isEditMode"
                                @focus="editorFocus = true"
                                @blur="editorFocus = false"
                            ></prism-editor>
                        </div>
                    </div>

                    <div v-if="isEditMode">
                        <!-- Volumes -->
                        <div v-if="false">
                            <h4 class="mb-3">{{ t("volume", 2) }}</h4>
                            <div class="shadow-box big-padding mb-3">
                            </div>
                        </div>

                        <!-- Networks -->
                        <h4 class="mb-3">{{ t("network", 2) }}</h4>
                        <div class="shadow-box big-padding mb-3">
                            <NetworkInput />
                        </div>
                    </div>

<!--                    <div class="shadow-box big-padding mb-3">-->
<!--                        <div class="mb-3">-->
<!--                            <label for="name" class="form-label"> Search Templates</label>-->
<!--                            <input id="name" v-model="name" type="text" class="form-control" placeholder="Search..." required>-->
<!--                        </div>-->

<!--                        <prism-editor v-if="false" v-model="yamlConfig" class="yaml-editor" :highlight="highlighter" line-numbers @input="yamlCodeChange"></prism-editor>-->
<!--                    </div>-->
                </div>
            </div>

            <div v-if="!stack?.isManagedByDockge && !processing">
                {{ t("stackNotManagedByDockgeMsg") }}
            </div>

            <!-- Delete Dialog -->
            <BModal v-model="showDeleteDialog" :okTitle="t('deleteStack')" okVariant="danger" @ok="deleteDialog">
                {{ t("deleteStackMsg") }}
            </BModal>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { highlight, languages } from "prismjs/components/prism-core";
import { PrismEditor } from "vue-prism-editor";
import "prismjs/components/prism-yaml";
import { parseDocument, Document } from "yaml";

import "prismjs/themes/prism-tomorrow.css";
import "vue-prism-editor/dist/prismeditor.min.css";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
    COMBINED_TERMINAL_COLS,
    COMBINED_TERMINAL_ROWS,
    copyYAMLComments, envsubstYAML,
    getCombinedTerminalName,
    getComposeTerminalName,
    PROGRESS_TERMINAL_ROWS,
    RUNNING
} from "../../../common/util-common";
import { BModal } from "bootstrap-vue-next";
import NetworkInput from "../components/NetworkInput.vue";
import dotenv from "dotenv";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSocket } from "../sockets";
import Terminal from "../components/Terminal.vue";
import { toastError, toastRes } from "../toast";
import { json } from "express";
import {JsonConfig, Stack} from "../../../common/types";
import * as stream from "stream";

const template = `version: "3.8"
services:
  nginx:
    image: nginx:latest
    restart: unless-stopped
    ports:
      - "8080:80"
`;
const envDefault = "# VARIABLE=value #comment";

let yamlErrorTimeout = null;

let serviceStatusTimeout: NodeJS.Timeout | null = null;
let prismjsSymbolDefinition = {
    "symbol": {
        pattern: /(?<!\$)\$(\{[^{}]*\}|\w+)/,
    }
};

// Tool
const { t } = useI18n();
const socket = useSocket();
const route = useRoute();
const router = useRouter();

// Refs
const progressTerminal = ref<typeof Terminal>();
const containerList = ref<Element>();

// Data
const editorFocus = ref(false);
const jsonConfig = ref<JsonConfig>({});
const envsubstJSONConfig = ref<Record<string, object>>({});
const yamlError = ref("");
const processing = ref(true);
const showProgressTerminal = ref(false);
const progressTerminalRows = ref(PROGRESS_TERMINAL_ROWS);
const combinedTerminalRows = ref(COMBINED_TERMINAL_ROWS);
const combinedTerminalCols = ref(COMBINED_TERMINAL_COLS);
const stack = ref<Stack>({});
const serviceStatusList = ref<Record<string, object>>({});
const isEditMode = ref(false);
const submitted = ref(false);
const showDeleteDialog = ref(false);
const newContainerName = ref("");
const stopServiceStatusTimeout = ref(false);
const yamlDoc = ref("");

// Computed
const endpoint = computed(() => {
    return stack.value?.endpoint || route.params.endpoint as string || "";
});

const filesLink = computed(() => {
    if (stack.value?.endpoint) {
        return `/files/${stack.value?.name}/${stack.value?.endpoint}`;
    } else {
        return `/files/${stack.value?.name}`;
    }
});

const endpointDisplay = computed(() => {
    return socket.endpointDisplayFunction(endpoint.value);
});

const urls = computed(() => {
    if (!envsubstJSONConfig.value["x-dockge"] || !envsubstJSONConfig.value["x-dockge"].urls
        || !Array.isArray(envsubstJSONConfig.value["x-dockge"].urls)) {
        return [];
    }

    let urls = [];
    for (const url of envsubstJSONConfig.value["x-dockge"].urls) {
        let display;
        try {
            let obj = new URL(url);
            let pathname = obj.pathname;
            if (pathname === "/") {
                pathname = "";
            }
            display = obj.host + pathname + obj.search;
        } catch (e) {
            display = url;
        }

        urls.push({
            display,
            url,
        });
    }
    return urls;
});

const isAdd = computed(() => {
    return route.path === "/compose" && !submitted.value;
});

/**
 * Get the stack from the global stack list, because it may contain more real-time data like status
 * @return {*}
 */
const globalStack = computed(() => {
    return socket.completeStackList.value[stack.value?.name + "_" + endpoint.value];
});

const status = computed(() => {
    return globalStack.value?.status;
});

const active = computed(() => {
    return status.value === RUNNING;
});

const terminalName = computed(() => {
    if (!stack.value?.name) {
        return "";
    }
    return getComposeTerminalName(endpoint.value, stack.value?.name);
});

const combinedTerminalName = computed(() => {
    if (!stack.value?.name) {
        return "";
    }
    return getCombinedTerminalName(endpoint.value, stack.value?.name);
});

const networks = computed(() => {
    return jsonConfig.value.networks;
});

const url = computed(() => {
    if (stack.value?.endpoint) {
        return `/compose/${stack.value?.name}/${stack.value?.endpoint}`;
    } else {
        return `/compose/${stack.value?.name}`;
    }
});

// Methods
const startServiceStatusTimeout = () => {
    serviceStatusTimeout && clearTimeout(serviceStatusTimeout);
    serviceStatusTimeout = setTimeout(async () => {
        requestServiceStatus();
    }, 5000);
};

const requestServiceStatus = () => {
    socket.emitAgent(endpoint.value, "serviceStatusList", stack.value?.name, (res) => {
        if (res.ok) {
            serviceStatusList.value = res.serviceStatusList;
        }
        if (!stopServiceStatusTimeout.value) {
            startServiceStatusTimeout();
        }
    });
};

const exitConfirm = (next) => {
    if (isEditMode.value) {
        if (confirm("You are currently editing a stack. Are you sure you want to leave?")) {
            exitAction();
            next();
        } else {
            next(false);
        }
    } else {
        exitAction();
        next();
    }
};

const exitAction = () => {
    console.log("exitAction");
    stopServiceStatusTimeout.value = true;
    clearTimeout(serviceStatusTimeout);

    // Leave Combined Terminal
    console.debug("leaveCombinedTerminal", endpoint.value, stack.value?.name);
    socket.emitAgent(endpoint.value, "leaveCombinedTerminal", stack.value?.name, () => {});
};

const bindTerminal = () => {
    progressTerminal.value?.bind(endpoint.value, terminalName.value);
};

const loadStack = () => {
    processing.value = true;
    socket.emitAgent(endpoint.value, "getStack", stack.value?.name, (res) => {
        if (res.ok) {
            stack.value = res.stack;
            yamlCodeChange();
            processing.value = false;
            bindTerminal();
        } else {
            toastRes(res);
        }
    });
};

const deployStack = () => {
    processing.value = true;

    if (!jsonConfig.value.services) {
        toastError("No services found in compose.yaml");
        processing.value = false;
        return;
    }

    // Check if services is object
    if (typeof jsonConfig.value.services !== "object") {
        toastError("Services must be an object");
        processing.value = false;
        return;
    }

    let serviceNameList = Object.keys(jsonConfig.value.services);

    // Set the stack name if empty, use the first container name
    if (!stack.value?.name && serviceNameList.length > 0) {
        let serviceName = serviceNameList[0];
        let service = jsonConfig.value.services[serviceName];

        if (service && service.container_name) {
            stack.value.name = service.container_name;
        } else {
            stack.value.name = serviceName;
        }
    }

    bindTerminal();

    socket.emitAgent(stack.value?.endpoint, "deployStack", stack.value?.name, stack.value?.composeYAML,
        stack.value?.composeENV, isAdd.value, (res) => {
            processing.value = false;
            toastRes(res);

            if (res.ok) {
                isEditMode.value = false;
                router.push(url.value);
            }
        });
};

const saveStack = () => {
    processing.value = true;

    socket.emitAgent(stack.value?.endpoint, "saveStack", stack.value?.name, stack.value?.composeYAML,
        stack.value?.composeENV, isAdd.value, (res) => {
            processing.value = false;
            toastRes(res);

            if (res.ok) {
                isEditMode.value = false;
                router.push(url.value);
            }
        });
};

const startStack = () => {
    processing.value = true;

    socket.emitAgent(endpoint.value, "startStack", stack.value?.name, (res) => {
        processing.value = false;
        toastRes(res);
    });
};

const stopStack = () => {
    processing.value = true;

    socket.emitAgent(endpoint.value, "stopStack", stack.value?.name, (res) => {
        processing.value = false;
        toastRes(res);
    });
};

const downStack = () => {
    processing.value = true;

    socket.emitAgent(endpoint.value, "downStack", stack.value?.name, (res) => {
        processing.value = false;
        toastRes(res);
    });
};

const restartStack = () => {
    processing.value = true;

    socket.emitAgent(endpoint.value, "restartStack", stack.value?.name, (res) => {
        processing.value = false;
        toastRes(res);
    });
};

const updateStack = () => {
    processing.value = true;

    socket.emitAgent(endpoint.value, "updateStack", stack.value?.name, (res) => {
        processing.value = false;
        toastRes(res);
    });
};

const deleteDialog = () => {
    socket.emitAgent(endpoint.value, "deleteStack", stack.value?.name, (res) => {
        toastRes(res);
        if (res.ok) {
            router.push("/");
        }
    });
};

const discardStack = () => {
    loadStack();
    isEditMode.value = false;
};

const highlighterYAML = (code: string) => {
    if (!languages.yaml_with_symbols) {
        languages.yaml_with_symbols = languages.insertBefore("yaml", "punctuation", {
            "symbol": prismjsSymbolDefinition["symbol"]
        });
    }
    return highlight(code, languages.yaml_with_symbols);
};

const highlighterENV = (code: string) => {
    if (!languages.docker_env) {
        languages.docker_env = {
            "comment": {
                pattern: /(^#| #).*$/m,
                greedy: true
            },
            "keyword": {
                pattern: /^\w*(?=[:=])/m,
                greedy: true
            },
            "value": {
                pattern: /(?<=[:=]).*?((?= #)|$)/m,
                greedy: true,
                inside: {
                    "string": [
                        {
                            pattern: /^ *'.*?(?<!\\)'/m,
                        },
                        {
                            pattern: /^ *".*?(?<!\\)"|^.*$/m,
                            inside: prismjsSymbolDefinition
                        },
                    ],
                },
            },
        };
    }
    return highlight(code, languages.docker_env);
};

const yamlToJSON = (yaml: string) => {
    let doc = parseDocument(yaml);
    if (doc.errors.length > 0) {
        throw doc.errors[0];
    }

    const config = doc.toJS() ?? {};

    // Check data types
    // "services" must be an object
    if (!config.services) {
        config.services = {};
    }

    if (Array.isArray(config.services) || typeof config.services !== "object") {
        throw new Error("Services must be an object");
    }

    return {
        config,
        doc,
    };
};

const yamlCodeChange = () => {
    try {
        let { config, doc } = yamlToJSON(stack.value?.composeYAML);

        yamlDoc.value = doc;
        jsonConfig.value = config;

        let env = dotenv.parse(stack.value?.composeENV);
        let envYAML = envsubstYAML(stack.value?.composeYAML, env);
        envsubstJSONConfig.value = yamlToJSON(envYAML).config;

        clearTimeout(yamlErrorTimeout);
        this.yamlError = "";
    } catch (e) {
        clearTimeout(yamlErrorTimeout);

        if (yamlError.value) {
            yamlError.value = e.message;

        } else {
            yamlErrorTimeout = setTimeout(() => {
                yamlError.value = e.message;
            }, 3000);
        }
    }
};

const enableEditMode = () => {
    isEditMode.value = true;
};

const checkYAML = () => {

};

const addContainer = () => {
    checkYAML();

    if (jsonConfig.value.services[newContainerName.value]) {
        toastError("Container name already exists");
        return;
    }

    if (!newContainerName.value) {
        toastError("Container name cannot be empty");
        return;
    }

    jsonConfig.value.services[newContainerName.value] = {
        restart: "unless-stopped",
    };
    newContainerName.value = "";
    let element = containerList.value?.lastElementChild;
    element.scrollIntoView({
        block: "start",
        behavior: "smooth"
    });
};

const stackNameToLowercase = () => {
    stack.value.name = stack.value?.name?.toLowerCase();
};

onBeforeRouteUpdate((to, from, next) => {
    exitConfirm(next);
});

onBeforeRouteLeave((to, from, next) => {
    exitConfirm(next);
});

watch(() => stack.value?.composeYAML, () => {
    if (editorFocus.value) {
        console.debug("yaml code changed");
        yamlCodeChange();
    }
}, { deep: true });

watch(() => stack.value?.composeENV, () => {
    if (editorFocus.value) {
        console.debug("env code changed");
        yamlCodeChange();
    }
}, { deep: true });

watch(jsonConfig, () => {
    if (editorFocus.value) {
        console.debug("jsonConfig Changed");
        let doc = new Document(jsonConfig.value);

        // Stick back the yaml comments
        if (yamlDoc.value) {
            copyYAMLComments(doc, yamlDoc.value);
        }

        stack.value.composeYAML = doc.toString();
        yamlDoc.value = doc;
    }
}, { deep: true });

watch(route, (to, from) => {

});

onMounted(() => {
    if (isAdd.value) {
        processing.value = false;
        isEditMode.value = true;

        let composeYAML;
        let composeENV;

        if (socket.composeTemplate) {
            composeYAML = socket.composeTemplate;
            socket.composeTemplate = "";
        } else {
            composeYAML = template;
        }
        if (socket.envTemplate) {
            composeENV = socket.envTemplate;
            socket.envTemplate = "";
        } else {
            composeENV = envDefault;
        }

        // Default Values
        stack.value = {
            name: "",
            composeYAML,
            composeENV,
            isManagedByDockge: true,
            endpoint: "",
        };

        yamlCodeChange();

    } else {
        stack.value.name = route.params.stackName;
        loadStack();
    }

    requestServiceStatus();
});
</script>

<style scoped lang="scss">
@import "../styles/vars.scss";

.terminal {
    height: 200px;
}

.editor-box {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    &.edit-mode {
        background-color: #2c2f38 !important;
    }
}

.agent-name {
    font-size: 13px;
    color: $dark-font-color3;
}
</style>
