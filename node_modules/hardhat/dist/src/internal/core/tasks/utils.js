export function formatTaskId(taskId) {
    if (typeof taskId === "string") {
        return taskId;
    }
    return taskId.join(" ");
}
export function getActorFragment(pluginId) {
    return pluginId !== undefined ? `Plugin ${pluginId} is` : "You are";
}
//# sourceMappingURL=utils.js.map