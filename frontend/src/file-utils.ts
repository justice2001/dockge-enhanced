import { languages } from "prismjs/components/prism-core";

import "prismjs/components/prism-json.js";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-log.js";

export const languageList = [
    {
        label: "YAML",
        value: "yaml",
        lang: languages.yaml,
        ext: [ "yaml", "yml" ]
    },
    {
        label: "Json",
        value: "json",
        lang: languages.json,
        ext: [ "json" ]
    },
    {
        label: "Toml",
        value: "toml",
        lang: languages.toml,
        ext: [ "toml" ]
    },
    {
        label: "Shell",
        value: "bash",
        lang: languages.bash,
        ext: [ "sh" ]
    },
    {
        label: "Css",
        value: "css",
        lang: languages.css,
        ext: [ "css" ],
    },
    {
        label: "LOG",
        value: "log",
        lang: languages.log,
        ext: [ "log" ],
    }
];

export const getFileExtension = (filename: string): string => {
    const extension = filename.match(/\.([^.]+)$/);
    return extension ? extension[1] : "";
};

export const getCompatibleLanguage = (ext: string) => {
    const langSupportingExt = languageList.filter(lang => lang.ext.includes(ext));
    return langSupportingExt.length > 0 ? langSupportingExt[0] : languageList[0];
};
