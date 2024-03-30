<script setup lang="ts">
import {useRoute} from "vue-router";

let lastSelectTime = 0;

import { ref, computed, onMounted } from "vue";
import {useSocket} from "../sockets";
import {toastError, toastRes, toastSuccess} from "../toast";
import FileEditor from "../components/FileEditor.vue";
import Confirm from "../components/Confirm.vue";

// Use
const route = useRoute();
const socket = useSocket();

// Refs
const fileEditor = ref<FileEditor>();
const createFileModal = ref<Confirm>();

// Reactive variables
const files = ref([]);
const selected = ref<string[]>([]);
const currentPath = ref<string>("/");
const newFileData = ref<{ isFolder: boolean; fileName: string }>({
    isFolder: false,
    fileName: "",
});
const stack = ref<Record<string, object>>({});

// Computed properties
const stackName = computed(() => {
    return route.params.stackName;
});

const endpoint = computed(() => {
    return stack.value.endpoint || route.params.endpoint || "";
});

const newFileLabel = computed(() => {
    return newFileData.value.isFolder ? {
        title: "newFolder",
        placeholder: "folderName",
    } : {
        title: "newFile",
        placeholder: "fileName",
    };
});

// Methods
const select = (ev: MouseEvent, file) => {
    const isMac = window.navigator.userAgent.toLowerCase().includes("mac");
    if (isMac ? ev.metaKey : ev.ctrlKey) {
        // Multiple selection
        if (selected.value.includes(file.name)) {
            selected.value = selected.value.filter((f) => f !== file.name);
        } else {
            selected.value.push(file.name);
        }
    } else {
        // Single selection
        if (selected.value.length === 1 && file.name === selected.value[0] && Date.now() - lastSelectTime < 1000) {
            console.log("Double Click");
            open(file);
        }
        selected.value = [file.name];
        lastSelectTime = Date.now();
    }
};

const open = (file) => {
    console.log(file);
    if (file.folder) {
        // Open Folder
        loadDir(file.path);
    } else {
        // Open File
        fileEditor.value?.open(file);
    }
};

const loadDir = (dir: string) => {
    socket.emitAgent(endpoint.value, "listDir", stackName.value, dir, (res: { files: any[] }) => {
        console.log(res.files);
        currentPath.value = dir;
        files.value = res.files;
    });
};

const openNewFileModel = (isFolder = false) => {
    newFileData.value.isFolder = isFolder;
    newFileData.value.fileName = "";
    newFileData.value.fileName = "";
    createFileModal.value?.show();
};

const newFile = () => {
    // Check file existence
    const filter = files.value.filter(f => f.name === newFileData.value.fileName);
    if (filter.length > 0) {
        toastError("File Exist");
        return;
    }
    socket.emitAgent(endpoint.value, "createFile", stackName.value, currentPath.value, newFileData.value.isFolder
        , newFileData.value.fileName, (res: { ok: boolean }) => {
            if (res.ok) {
                toastSuccess("Created");
                loadDir(currentPath.value);
            }
        });
};

const loadStack = () => {
    processing.value = true;
    socket.emitAgent(endpoint.value, "getStack", stack.value.name, (res: { ok: boolean; stack: Record<string, any> }) => {
        if (res.ok) {
            stack.value = res.stack;
        } else {
            toastRes(res);
        }
    });
};

// Lifecycle hook
onMounted(() => {
    loadDir("/");
});
</script>

<template>
    <transition name="slide-fade" appear>
        <div>
            <h1 class="mb-3">Data - {{ stackName }} - {{ currentPath }}</h1>
            <p class="tips">这里只会展示位于 ${DATA} (/opt/docker/[stackName]) 目录的文件</p>
            <div>
                <div class="btn-group me-2">
                    <button class="btn btn-dark" @click="openNewFileModel(false)">
                        <font-awesome-icon icon="file" />
                        {{ $t("newFile") }}
                    </button>
                    <button class="btn btn-dark" @click="openNewFileModel(true)">
                        <font-awesome-icon icon="folder" />
                        {{ $t("newFolder") }}
                    </button>
                </div>
                <div v-if="selected.length > 0 && !selected.includes('..')" class="btn-group">
                    <button class="btn btn-dark">
                        <font-awesome-icon icon="scissors" />
                        {{ $t("cut") }}
                    </button>
                    <button class="btn btn-dark">
                        <font-awesome-icon icon="copy" />
                        {{ $t("copy") }}
                    </button>
                    <button class="btn btn-dark">
                        <font-awesome-icon icon="paste" />
                        {{ $t("paste") }}
                    </button>
                    <button v-if="selected.length < 2" class="btn btn-dark">
                        <font-awesome-icon icon="edit" />
                        {{ $t("rename") }}
                    </button>
                    <button class="btn btn-danger">
                        <font-awesome-icon icon="trash" />
                        {{ $t("delete") }}
                    </button>
                </div>
            </div>
            <div class="shadow-box mb-3 stack-list mt-3">
                <div v-if="files.length < 1" class="d-flex flex-column align-items-center my-5">
                    <FontAwesomeIcon icon="box" class="empty-icon" />
                    <h2 class="mt-4">{{ $t("noData") }}</h2>
                </div>
                <FileItem
                    v-for="(file, idx) in files"
                    :key="idx"
                    :selected="selected.indexOf(file.name) > -1"
                    :file="file"
                    @click="select($event, file)"
                />
            </div>

            <FileEditor ref="fileEditor" :endpoint="endpoint" :stack-name="stackName" />
            <Confirm ref="createFileModal" :title="$t(newFileLabel.title)" @yes="newFile">
                <input
                    v-model="newFileData.fileName" class="form-control"
                    :placeholder="$t(newFileLabel.placeholder)"
                />
            </Confirm>
        </div>
    </transition>
</template>

<style scoped lang="scss">
.tips {
    font-size: 0.8rem;
    color: #6c757d;
}

.empty-icon {
    font-size: 60px;
}
</style>
