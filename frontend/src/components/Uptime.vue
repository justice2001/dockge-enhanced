<template>
    <span :class="className"><font-awesome-icon :icon="statusName" /></span>
</template>

<script>
import { statusColor, statusNameIcon } from "../../../common/util-common";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
    components: { FontAwesomeIcon },
    props: {
        stack: {
            type: Object,
            default: null,
        },
        fixedWidth: {
            type: Boolean,
            default: false,
        },
    },

    computed: {
        uptime() {
            return this.$t("notAvailableShort");
        },

        color() {
            return statusColor(this.stack?.status);
        },

        statusName() {
            return statusNameIcon(this.stack?.status);
        },

        className() {
            let className = `badge rounded-pill bg-${this.color}`;

            if (this.fixedWidth) {
                className += " fixed-width";
            }
            return className;
        },
    },
};
</script>

<style scoped>
.badge {
    min-width: 32px;

}

.fixed-width {
    width: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
