export function isStartable(obj) {
    return obj != null && typeof obj.start === 'function' && typeof obj.stop === 'function';
}
export async function start(...objs) {
    const startables = [];
    for (const obj of objs) {
        if (isStartable(obj)) {
            startables.push(obj);
        }
    }
    await Promise.all(startables.map(async (s) => {
        if (s.beforeStart != null) {
            await s.beforeStart();
        }
    }));
    await Promise.all(startables.map(async (s) => {
        await s.start();
    }));
    await Promise.all(startables.map(async (s) => {
        if (s.afterStart != null) {
            await s.afterStart();
        }
    }));
}
export async function stop(...objs) {
    const startables = [];
    for (const obj of objs) {
        if (isStartable(obj)) {
            startables.push(obj);
        }
    }
    await Promise.all(startables.map(async (s) => {
        if (s.beforeStop != null) {
            await s.beforeStop();
        }
    }));
    await Promise.all(startables.map(async (s) => {
        await s.stop();
    }));
    await Promise.all(startables.map(async (s) => {
        if (s.afterStop != null) {
            await s.afterStop();
        }
    }));
}
//# sourceMappingURL=startable.js.map