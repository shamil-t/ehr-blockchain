import type { NewTaskActionFunction } from "hardhat/types/tasks";
interface TaskDeployArguments {
    modulePath: string;
    parameters?: string;
    deploymentId?: string;
    defaultSender?: string;
    strategy: string;
    reset: boolean;
    verify: boolean;
    writeLocalhostDeployment: boolean;
}
declare const taskDeploy: NewTaskActionFunction<TaskDeployArguments>;
export default taskDeploy;
//# sourceMappingURL=deploy.d.ts.map