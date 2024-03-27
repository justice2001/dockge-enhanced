<script lang="ts">
import { defineComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { log } from "../../../backend/log";

let lastSelectTime = 0;

export default defineComponent({
    name: "Files",
    components: { FontAwesomeIcon },
    data() {
        return {
            files: [],
            selected: [],
            currentPath: "/",
            newFileData: {
                isFolder: false,
                fileName: "",
            },
            stack: {}
        };
    },
    computed: {
        stackName() {
            return this.$route.params.stackName;
        },

        endpoint() {
            return this.stack.endpoint || this.$route.params.endpoint || "";
        },

        newFileLabel() {
            return this.newFileData.isFolder ? {
                title: "newFolder",
                placeholder: "folderName",
            } : {
                title: "newFile",
                placeholder: "fileName",
            };
        },
    },
    mounted() {
        this.loadDir("/");
    },
    methods: {
        select(ev, file) {
            const isMac = window.navigator.userAgent.toLowerCase().includes("mac");
            if (isMac ? ev.metaKey : ev.ctrlKey) {
                // 多选
                if (this.selected.includes(file.name)) {
                    this.selected = this.selected.filter((f) => f !== file.name);
                } else {
                    this.selected.push(file.name);
                }
            } else {
                // 单选
                if (this.selected.length === 1 && file.name === this.selected[0] && Date.now() - lastSelectTime < 1000) {
                    console.log("Double Click");
                    this.open(file);
                }
                this.selected = [ file.name ];
                lastSelectTime = Date.now();
            }
        },

        open(file) {
            console.log(file);
            if (file.folder) {
                // Open Folder
                this.loadDir(file.path);
            } else {
                // Open File
                this.$refs.fileEditor.open(file);
            }
        },

        loadDir(dir: string) {
            this.$root.emitAgent(this.endpoint, "listDir", this.stackName, dir, (res) => {
                console.log(res.files);
                this.currentPath = dir;
                this.files = res.files;
            });
        },

        openNewFileModel(isFolder: boolean = false) {
            this.newFileData.isFolder = isFolder;
            this.newFileData.fileName = "";
            this.newFileData.fileName = "";
            this.$refs.createFileModal.show();
        },

        newFile() {
            // Check file
            const filter = this.files.filter(f => f.name === this.newFileData.fileName);
            if (filter.length > 0) {
                this.$root.toastError("File Exist");
                return;
            }
            this.$root.emitAgent(this.endpoint, "createFile", this.stackName, this.currentPath, this.newFileData.isFolder
                , this.newFileData.fileName, (res) => {
                    if (res.ok) {
                        this.$root.toastSuccess("Created");
                        this.loadDir(this.currentPath);
                    }
                });
        },
        
        loadStack() {
            this.processing = true;
            this.$root.emitAgent(this.endpoint, "getStack", this.stack.name, (res) => {
                if (res.ok) {
                    this.stack = res.stack;
                } else {
                    this.$root.toastRes(res);
                }
            })
        }
    },
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
