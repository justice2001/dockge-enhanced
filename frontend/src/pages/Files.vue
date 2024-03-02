<script lang="ts">
import { defineComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { log } from "../../../backend/log";

export default defineComponent({
    name: "Files",
    components: { FontAwesomeIcon },
    data() {
        return {
            files: [
                { name: "111.doc",
                    path: "/opt/docker/homepage/111.doc",
                    folder: false },
                { name: "data",
                    path: "/opt/docker/homepage/data",
                    folder: true },
                { name: "config",
                    path: "/opt/docker/homepage/config",
                    folder: true },
                { name: "icons",
                    path: "/opt/docker/homepage/icons",
                    folder: true },
            ]
        };
    },
    computed: {
        stackName() {
            return this.$route.params.stackName;
        },

        endpoint() {
            return this.$route.params.endpoint || "";
        },
    },
    mounted() {
        this.$root.emitAgent(this.endpoint, "listDir", "homepage", "/", (res) => {
            console.log(res.files);
            this.files = res.files;
        });
    },
    methods: {
        open(file) {
            console.log(file);
            if (file.folder) {
                // Open Folder
            } else {
                // Open File
                this.$refs.fileEditor.open(file);
            }
        },
    },
});
</script>

<template>
    <transition name="slide-fade" appear>
        <div>
            <h1 class="mb-3">Data - {{ stackName }}</h1>
            <p class="tips">这里只会展示位于 ${DATA} (/opt/docker/[stackName]) 目录的文件</p>
            <div class="btn-group">
                <button class="btn btn-dark">
                    <font-awesome-icon icon="file" />
                    {{ $t("newFile") }}
                </button>
                <button class="btn btn-dark">
                    <font-awesome-icon icon="folder" />
                    {{ $t("newFolder") }}
                </button>
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
                <button class="btn btn-dark">
                    <font-awesome-icon icon="edit" />
                    {{ $t("rename") }}
                </button>
                <button class="btn btn-danger">
                    <font-awesome-icon icon="trash" />
                    {{ $t("delete") }}
                </button>
            </div>
            <div class="shadow-box mb-3 stack-list mt-3">
                <FileItem
                    v-for="(file, idx) in files"
                    :key="idx"
                    :file="file"
                    @click="open(file)"
                />
            </div>

            <FileEditor :endpoint="endpoint" :stack-name="stackName" ref="fileEditor" />
        </div>
    </transition>
</template>

<style scoped lang="scss">
.tips {
    font-size: 0.8rem;
    color: #6c757d;
}
</style>
