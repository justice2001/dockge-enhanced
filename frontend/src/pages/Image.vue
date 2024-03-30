<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    // eslint-disable-next-line vue/no-reserved-component-names
    name: "Image",
    data(vm) {
        return {
            images: []
        };
    },
    mounted() {
        this.getImagesList();
    },
    methods: {
        getImagesList() {
            this.$root.emitAgent("", "getImageList", (res) => {
                this.images = res.images;
            });
        },
        prune() {
            this.$root.emitAgent("", "pruneImages", true, (res) => {
                if (res.ok) {
                    this.getImagesList();
                }
            });
        }
    },
});
</script>

<template>
    <button class="btn btn-primary" @click="getImagesList">Get PS</button>
    <button class="btn btn-primary" @click="prune">Prune</button>
    <table class="table">
        <thead>
            <tr>
                <th class="col">ID</th>
                <th class="col">Repo</th>
                <th class="col">Tags</th>
                <th class="col">Size</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="image in images" :key="image.imageId">
                <th class="row">{{ image.imageId }}</th>
                <td>{{ image.repository }}</td>
                <td>{{ image.tag }}</td>
                <td>{{ image.size }}</td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped lang="scss">

</style>
