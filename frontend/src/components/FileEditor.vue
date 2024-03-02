<script setup lang="ts">
import { highlight, languages } from "prismjs/components/prism-core";
import { PrismEditor } from "vue-prism-editor";
import "prismjs/themes/prism-dark.css";
import "vue-prism-editor/dist/prismeditor.min.css";

import "prismjs/components/prism-json.js";
import "prismjs/components/prism-yaml";

import { ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {FileDef} from "../util-frontend";

const code = ref<string>("");

const opened = ref<boolean>(false);

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

const language = ref({
    label: "YAML",
    value: "yaml",
    lang: languages.yaml
});

const fileInfo = ref<FileDef>({
    name: "UNTITLED",
    path: "",
    folder: false,
});

const languageChange = (e) => {
    const res = allLanguage.filter(lang => lang.value === e.target.value);
    if (res.length <= 0) {
        language.value = allLanguage[0];
    } else {
        language.value = res[0];
    }
};

const open = (file: FileDef) => {
    opened.value = true;
    fileInfo.value = file;
};

const close = () => {
    opened.value = false;
};

defineExpose({ open });

const highlighter = (code) => {
    return highlight(code, language.value.lang, language.value.value);
};
</script>

<template>
    <div v-if="opened" class="editor-mask">
        <div class="editor shadow-box mb-3">
            <div class="title">{{ fileInfo.name }}</div>
            <button class="btn-close" @click="close" />
            <div class="operation">
                <div class="btn-group">
                    <button class="btn btn-dark"><font-awesome-icon icon="floppy-disk" /></button>
                </div>
                <select :value="language.value" class="form-select ms-2" @change="languageChange">
                    <option v-for="lang in allLanguage" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
                </select>
            </div>
            <div class="editor-wrapper">
                <PrismEditor v-model="code" class="my-editor" :highlight="highlighter" line-numbers />
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
