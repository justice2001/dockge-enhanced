<script lang="ts">
import { highlight, languages } from "prismjs/components/prism-core";
import { PrismEditor } from "vue-prism-editor";
import "prismjs/themes/prism-tomorrow.css";
import "vue-prism-editor/dist/prismeditor.min.css";

import { defineComponent } from "vue";
import { FileDef } from "../util-frontend";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Modal } from "bootstrap";
import {getCompatibleLanguage, getFileExtension, languageList} from "../file-utils";
import {log} from "../../../backend/log";

const allLanguage = [
    {
        label: "YAML",
        value: "yaml",
        lang: languages.yaml,
        ext: [ "yaml", "yml" ]
    },
    {
        label: "Json",
        value: "json",
        lang: languages.json
    },
    {
        label: "Toml",
        value: "toml",
        lang: languages.toml
    }
];

export default defineComponent({
    name: "FileEditor",
    components: {
        FontAwesomeIcon,
        PrismEditor,
    },
    props: {
        endpoint: {
            type: String,
            required: true
        },
        stackName: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            allLanguage: languageList,
            code: "",
            opened: false,
            disabled: false,
            language: {
                label: "YAML",
                value: "yaml",
                lang: languages.yaml
            },
            fileInfo: {
                name: "UNTITLED",
                path: "",
                folder: false,
            },
            edited: false,
            fullScreen: false,
            model: null,
        };
    },
    mounted() {
        this.model = new Modal(this.$refs.editor);
    },
    methods: {
        languageChange(e) {
            const res = allLanguage.filter(lang => lang.value === e.target.value);
            if (res.length <= 0) {
                this.language = allLanguage[0];
            } else {
                this.language = res[0];
            }
        },

        open(file: FileDef) {
            this.model.show();
            this.disabled = true;
            this.fileInfo = file;
            const ext = getFileExtension(file.name);
            this.language = getCompatibleLanguage(ext);
            this.$root.emitAgent(this.endpoint, "getFile", this.stackName, file.path, (res) => {
                this.code = res.content;
                this.disabled = false;
            });
        },

        close() {
            this.model.hide();
        },

        highlighter(code) {
            return highlight(code, this.language.lang, this.language.value);
        },

        save() {
            this.$root.emitAgent(this.endpoint, "saveFile", this.stackName, this.fileInfo.path, this.code, (res) => {
                if (res.ok) {
                    console.log("Saved!");
                    this.edited = false;
                }
            });
        },
    }
});
</script>

<template>
    <div ref="editor" class="editor modal fade" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-scrollable" :class="fullScreen ? 'modal-fullscreen' : 'modal-lg'">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="title">{{ fileInfo.name }} <span v-if="edited">(Edited)</span> </h5>
                    <button type="button" class="btn-close" @click="close" />
                </div>
                <div class="modal-body d-flex flex-column overflow-hidden">
                    <div class="operation">
                        <div class="btn-group">
                            <button class="btn btn-dark" @click="save"><font-awesome-icon icon="floppy-disk" /></button>
                            <button class="btn btn-dark" @click="fullScreen = !fullScreen">
                                <font-awesome-icon :icon="fullScreen ? 'compress' : 'expand'" />
                            </button>
                        </div>
                        <select :value="language.value" class="form-select ms-2" @change="languageChange">
                            <option v-for="lang in allLanguage" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
                        </select>
                    </div>
                    <div class="editor-wrapper shadow-box">
                        <PrismEditor
                            v-model="code"
                            class="my-editor"
                            :readonly="disabled"
                            :highlight="highlighter"
                            line-numbers
                            @input="edited = true"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.editor {
    & .modal-header {
        padding-bottom: 0;
    }

    & .modal-body {
        padding-top: 10px;
    }

    & .title {
        text-align: center;
    }

    & .operation {
        display: flex;
        align-items: center;
    }

    & .editor-wrapper {
        background: #2c2f38 !important;
        flex: 1;
        overflow: auto;
        margin-top: 10px;
    }

    & .my-editor {
        /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
        background: #2c2f38;
        color: #ccc;

        /* you must provide font-family font-size line-height. Example: */
        font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
        font-size: 14px;
        line-height: 1.5;
        min-height: 50vh;
        overflow: auto;
    }
}
</style>
