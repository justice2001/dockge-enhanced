<script setup lang="ts">

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { FileDef } from "../util-frontend";

interface FileItemProps {
    file: FileDef
}

// eslint-disable-next-line no-unused-vars
defineProps<FileItemProps>();

</script>

<template>
    <div class="item">
        <font-awesome-icon :icon="file.folder ? 'folder' : 'file'" />
        <span class="file-name">{{ file.name }}</span>
    </div>
</template>

<style scoped lang="scss">
.item {
    cursor: pointer;
    user-select: none;

    & .file-name {
        margin-left: 10px;
    }
}
</style>
