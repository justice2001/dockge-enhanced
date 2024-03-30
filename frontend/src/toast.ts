import {useToast} from "vue-toastification";

const toast = useToast();

export const toastRes = (res: unknown) => {
    if (typeof res !== "object") {
        return;
    }
    let msg = res.msg;
    if (res.msgi18n) {
        if (msg != null && typeof msg === "object") {
            msg = t(msg.key, msg.values);
        } else {
            msg = t(msg);
        }
    }

    if (res.ok) {
        toast.success(msg);
    } else {
        toast.error(msg);
    }
};

export const toastSuccess = (msg: string) => {
    toast.success(t(msg));
};

/**
 * Show an error toast
 * @param {string} msg Message to show
 * @returns {void}
 */
export const toastError = (msg: string) => {
    toast.error(t(msg));
};
