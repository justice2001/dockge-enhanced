export interface Stack {
    name?: string;
    composeYAML?: string;
    composeENV?: string;
    isManagedByDockge?: boolean;
    endpoint?: string;
    composeFileName?: string;
}

export interface JsonConfig {
    services?: Record<string, object>;
}
