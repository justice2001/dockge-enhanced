<script lang="ts">

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { FileDef } from "../util-frontend";
import {defineComponent} from "vue";

interface FileItemProps {
    file: FileDef
}

export default defineComponent({
    props: {
        file: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        }
    }
});

</script>

<template>
    <div class="item" :class="{selected}">
        <font-awesome-icon :icon="file.folder ? 'folder' : 'file'" />
        <span class="file-name">{{ file.name }}</span>
    </div>
</template>

<style scoped lang="scss">
.item {
    cursor: pointer;
    user-select: none;

    &.selected {
        background-color: #070a10;
    }

    & .file-name {
        margin-left: 10px;
    }
}
</style>
