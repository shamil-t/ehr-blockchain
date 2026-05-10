import { spawn as nodeSpawn } from "node:child_process";
export async function spawn(command, args, options) {
    const child = nodeSpawn(command, args, options);
    await new Promise((resolve, reject) => {
        child.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Command "${command} ${args.join(" ")}" exited with code ${code}`));
                return;
            }
            resolve();
        });
    });
}
//# sourceMappingURL=subprocess.js.map