<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{
    name: string
}>();

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

function textColor(bgColor) {
    // 将背景颜色转换为RGB
    const rgb = parseInt(bgColor.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    // 根据亮度选择文本颜色
    return brightness > 125 ? 'black' : 'white'; // 根据亮度选择合适的文本颜色
}


const style = computed(() => {
    const bgColor = stringToColor(props.name);
    const color = textColor(bgColor);
    return {
        '--tag-color': bgColor,
        '--text-color': color
    }
})
</script>

<template>
<div class="tag" :style="style">{{name}}</div>
</template>

<style scoped lang="scss">
.tag {
    background-color: var(--tag-color, #ffffff);
    color: var(--text-color, #333333);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}
</style>
