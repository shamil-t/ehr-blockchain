import type { NewTaskActionFunction } from "hardhat/types/tasks";
interface MigrateArguments {
    deploymentId: string;
}
declare const taskMigrate: NewTaskActionFunction<MigrateArguments>;
export default taskMigrate;
//# sourceMappingURL=migrate.d.ts.map