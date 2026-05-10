export interface AnalyticsFile {
    analytics: {
        clientId: string;
    };
}
export interface BasePayload {
    client_id: string;
    user_id: string;
    user_properties: {};
    events: Array<{
        name: string;
        params: {
            engagement_time_msec?: string;
            session_id?: string;
        };
    }>;
}
export interface TelemetryConfigPayload extends BasePayload {
    events: Array<{
        name: "TelemetryConfig";
        params: {
            enabled: boolean;
            session_id?: string;
        };
    }>;
}
export type AnalyticsEvent = {
    name: "task";
    params: {
        task: string;
    };
} | {
    name: "init";
    params: {
        hardhatVersion: "hardhat-2" | "hardhat-3";
        template: string;
    };
};
export interface Payload extends BasePayload {
    user_properties: {
        projectId: {
            value: string;
        };
        hardhatVersion: {
            value: string;
        };
        operatingSystem: {
            value: string;
        };
        nodeVersion: {
            value: string;
        };
    };
    events: Array<{
        name: AnalyticsEvent["name"];
        params: {
            engagement_time_msec: string;
            session_id: string;
        } & AnalyticsEvent["params"];
    }>;
}
//# sourceMappingURL=types.d.ts.map