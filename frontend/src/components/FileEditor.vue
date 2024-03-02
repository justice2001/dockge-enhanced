<script lang="ts">
import { highlight, languages } from "prismjs/components/prism-core";
import { PrismEditor } from "vue-prism-editor";
import "prismjs/themes/prism-dark.css";
import "vue-prism-editor/dist/prismeditor.min.css";

import "prismjs/components/prism-json.js";
import "prismjs/components/prism-yaml";

import { defineComponent, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { FileDef } from "../util-frontend";
import {log} from "../../../backend/log";

const allLanguage = [
    {
        label: "YAML",
        value: "yaml",
        lang: languages.yaml
    },
    {
        label: "Json",
        value: "json",
        lang: languages.json
    }
];

export default defineComponent({
    name: "FileEditor",
    components: {
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
            allLanguage: allLanguage,
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
        };
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
            this.opened = true;
            this.disabled = true;
            this.fileInfo = file;
            this.$root.emitAgent(this.endpoint, "getFile", this.stackName, file.path, (res) => {
                this.code = res.content;
                this.disabled = false;
            });
        },

        close() {
            this.opened = false;
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
        }
    }
});
</script>

<template>
    <div v-if="opened" class="editor-mask">
        <div class="editor shadow-box mb-3">
            <div class="title">{{ fileInfo.name }} <span v-if="edited">(Edited)</span> </div>
            <button class="btn-close" @click="close" />
            <div class="operation">
                <div class="btn-group">
                    <button class="btn btn-dark" @click="save"><font-awesome-icon icon="floppy-disk" /></button>
                </div>
                <select :value="language.value" class="form-select ms-2" @change="languageChange">
                    <option v-for="lang in allLanguage" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
                </select>
            </div>
            <div class="editor-wrapper">
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
</template>

<style scoped lang="scss">
.editor-mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;

    & .editor {
        position: relative;
        width: 50vw;
        height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        & .btn-close {
            position: absolute;
            right: 10px;
            top: 10px;
        }

        & .title {
            text-align: center;
        }

        & .operation {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }

        & .editor-wrapper {
            flex: 1;
            overflow: auto;
            margin-top: 10px;
        }
    }

    & .my-editor {
        /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
        background: #2d2d2d;
        color: #ccc;

        /* you must provide font-family font-size line-height. Example: */
        font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
        font-size: 14px;
        line-height: 1.5;
    }
}
</style>
