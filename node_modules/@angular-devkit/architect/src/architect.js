"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Architect = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const api_1 = require("./api");
const jobs_1 = require("./jobs");
const schedule_by_name_1 = require("./schedule-by-name");
const inputSchema = require('./input-schema.json');
const outputSchema = require('./output-schema.json');
function _createJobHandlerFromBuilderInfo(info, target, host, registry, baseOptions) {
    const jobDescription = {
        name: target ? `{${(0, api_1.targetStringFromTarget)(target)}}` : info.builderName,
        argument: { type: 'object' },
        input: inputSchema,
        output: outputSchema,
        info,
    };
    function handler(argument, context) {
        // Add input validation to the inbound bus.
        const inboundBusWithInputValidation = context.inboundBus.pipe((0, rxjs_1.concatMap)(async (message) => {
            if (message.kind === jobs_1.JobInboundMessageKind.Input) {
                const v = message.value;
                const options = {
                    ...baseOptions,
                    ...v.options,
                };
                // Validate v against the options schema.
                const validation = await registry.compile(info.optionSchema);
                const validationResult = await validation(options);
                const { data, success, errors } = validationResult;
                if (!success) {
                    throw new core_1.json.schema.SchemaValidationException(errors);
                }
                return { ...message, value: { ...v, options: data } };
            }
            else {
                return message;
            }
        }), 
        // Using a share replay because the job might be synchronously sending input, but
        // asynchronously listening to it.
        (0, rxjs_1.shareReplay)(1));
        // Make an inboundBus that completes instead of erroring out.
        // We'll merge the errors into the output instead.
        const inboundBus = (0, rxjs_1.onErrorResumeNext)(inboundBusWithInputValidation);
        const output = (0, rxjs_1.from)(host.loadBuilder(info)).pipe((0, rxjs_1.concatMap)((builder) => {
            if (builder === null) {
                throw new Error(`Cannot load builder for builderInfo ${JSON.stringify(info, null, 2)}`);
            }
            return builder.handler(argument, { ...context, inboundBus }).pipe((0, rxjs_1.map)((output) => {
                if (output.kind === jobs_1.JobOutboundMessageKind.Output) {
                    // Add target to it.
                    return {
                        ...output,
                        value: {
                            ...output.value,
                            ...(target ? { target } : 0),
                        },
                    };
                }
                else {
                    return output;
                }
            }));
        }), 
        // Share subscriptions to the output, otherwise the the handler will be re-run.
        (0, rxjs_1.shareReplay)());
        // Separate the errors from the inbound bus into their own observable that completes when the
        // builder output does.
        const inboundBusErrors = inboundBusWithInputValidation.pipe((0, rxjs_1.ignoreElements)(), (0, rxjs_1.takeUntil)((0, rxjs_1.onErrorResumeNext)(output.pipe((0, rxjs_1.last)()))));
        // Return the builder output plus any input errors.
        return (0, rxjs_1.merge)(inboundBusErrors, output);
    }
    return (0, rxjs_1.of)(Object.assign(handler, { jobDescription }));
}
/**
 * A JobRegistry that resolves builder targets from the host.
 */
class ArchitectBuilderJobRegistry {
    constructor(_host, _registry, _jobCache, _infoCache) {
        this._host = _host;
        this._registry = _registry;
        this._jobCache = _jobCache;
        this._infoCache = _infoCache;
    }
    _resolveBuilder(name) {
        const cache = this._infoCache;
        if (cache) {
            const maybeCache = cache.get(name);
            if (maybeCache !== undefined) {
                return maybeCache;
            }
            const info = (0, rxjs_1.from)(this._host.resolveBuilder(name)).pipe((0, rxjs_1.shareReplay)(1));
            cache.set(name, info);
            return info;
        }
        return (0, rxjs_1.from)(this._host.resolveBuilder(name));
    }
    _createBuilder(info, target, options) {
        const cache = this._jobCache;
        if (target) {
            const maybeHit = cache && cache.get((0, api_1.targetStringFromTarget)(target));
            if (maybeHit) {
                return maybeHit;
            }
        }
        else {
            const maybeHit = cache && cache.get(info.builderName);
            if (maybeHit) {
                return maybeHit;
            }
        }
        const result = _createJobHandlerFromBuilderInfo(info, target, this._host, this._registry, options || {});
        if (cache) {
            if (target) {
                cache.set((0, api_1.targetStringFromTarget)(target), result.pipe((0, rxjs_1.shareReplay)(1)));
            }
            else {
                cache.set(info.builderName, result.pipe((0, rxjs_1.shareReplay)(1)));
            }
        }
        return result;
    }
    get(name) {
        const m = name.match(/^([^:]+):([^:]+)$/i);
        if (!m) {
            return (0, rxjs_1.of)(null);
        }
        return (0, rxjs_1.from)(this._resolveBuilder(name)).pipe((0, rxjs_1.concatMap)((builderInfo) => (builderInfo ? this._createBuilder(builderInfo) : (0, rxjs_1.of)(null))), (0, rxjs_1.first)(null, null));
    }
}
/**
 * A JobRegistry that resolves targets from the host.
 */
class ArchitectTargetJobRegistry extends ArchitectBuilderJobRegistry {
    get(name) {
        const m = name.match(/^{([^:]+):([^:]+)(?::([^:]*))?}$/i);
        if (!m) {
            return (0, rxjs_1.of)(null);
        }
        const target = {
            project: m[1],
            target: m[2],
            configuration: m[3],
        };
        return (0, rxjs_1.from)(Promise.all([
            this._host.getBuilderNameForTarget(target),
            this._host.getOptionsForTarget(target),
        ])).pipe((0, rxjs_1.concatMap)(([builderStr, options]) => {
            if (builderStr === null || options === null) {
                return (0, rxjs_1.of)(null);
            }
            return this._resolveBuilder(builderStr).pipe((0, rxjs_1.concatMap)((builderInfo) => {
                if (builderInfo === null) {
                    return (0, rxjs_1.of)(null);
                }
                return this._createBuilder(builderInfo, target, options);
            }));
        }), (0, rxjs_1.first)(null, null));
    }
}
function _getTargetOptionsFactory(host) {
    return (0, jobs_1.createJobHandler)((target) => {
        return host.getOptionsForTarget(target).then((options) => {
            if (options === null) {
                throw new Error(`Invalid target: ${JSON.stringify(target)}.`);
            }
            return options;
        });
    }, {
        name: '..getTargetOptions',
        output: { type: 'object' },
        argument: inputSchema.properties.target,
    });
}
function _getProjectMetadataFactory(host) {
    return (0, jobs_1.createJobHandler)((target) => {
        return host.getProjectMetadata(target).then((options) => {
            if (options === null) {
                throw new Error(`Invalid target: ${JSON.stringify(target)}.`);
            }
            return options;
        });
    }, {
        name: '..getProjectMetadata',
        output: { type: 'object' },
        argument: {
            oneOf: [{ type: 'string' }, inputSchema.properties.target],
        },
    });
}
function _getBuilderNameForTargetFactory(host) {
    return (0, jobs_1.createJobHandler)(async (target) => {
        const builderName = await host.getBuilderNameForTarget(target);
        if (!builderName) {
            throw new Error(`No builder were found for target ${(0, api_1.targetStringFromTarget)(target)}.`);
        }
        return builderName;
    }, {
        name: '..getBuilderNameForTarget',
        output: { type: 'string' },
        argument: inputSchema.properties.target,
    });
}
function _validateOptionsFactory(host, registry) {
    return (0, jobs_1.createJobHandler)(async ([builderName, options]) => {
        // Get option schema from the host.
        const builderInfo = await host.resolveBuilder(builderName);
        if (!builderInfo) {
            throw new Error(`No builder info were found for builder ${JSON.stringify(builderName)}.`);
        }
        const validation = await registry.compile(builderInfo.optionSchema);
        const { data, success, errors } = await validation(options);
        if (!success) {
            throw new core_1.json.schema.SchemaValidationException(errors);
        }
        return data;
    }, {
        name: '..validateOptions',
        output: { type: 'object' },
        argument: {
            type: 'array',
            items: [{ type: 'string' }, { type: 'object' }],
        },
    });
}
class Architect {
    constructor(_host, registry = new core_1.json.schema.CoreSchemaRegistry(), additionalJobRegistry) {
        this._host = _host;
        this._jobCache = new Map();
        this._infoCache = new Map();
        const privateArchitectJobRegistry = new jobs_1.SimpleJobRegistry();
        // Create private jobs.
        privateArchitectJobRegistry.register(_getTargetOptionsFactory(_host));
        privateArchitectJobRegistry.register(_getBuilderNameForTargetFactory(_host));
        privateArchitectJobRegistry.register(_validateOptionsFactory(_host, registry));
        privateArchitectJobRegistry.register(_getProjectMetadataFactory(_host));
        const jobRegistry = new jobs_1.FallbackRegistry([
            new ArchitectTargetJobRegistry(_host, registry, this._jobCache, this._infoCache),
            new ArchitectBuilderJobRegistry(_host, registry, this._jobCache, this._infoCache),
            privateArchitectJobRegistry,
            ...(additionalJobRegistry ? [additionalJobRegistry] : []),
        ]);
        this._scheduler = new jobs_1.SimpleScheduler(jobRegistry, registry);
    }
    has(name) {
        return this._scheduler.has(name);
    }
    scheduleBuilder(name, options, scheduleOptions = {}) {
        // The below will match 'project:target:configuration'
        if (!/^[^:]+:[^:]+(:[^:]+)?$/.test(name)) {
            throw new Error('Invalid builder name: ' + JSON.stringify(name));
        }
        return (0, schedule_by_name_1.scheduleByName)(name, options, {
            scheduler: this._scheduler,
            logger: scheduleOptions.logger || new core_1.logging.NullLogger(),
            currentDirectory: this._host.getCurrentDirectory(),
            workspaceRoot: this._host.getWorkspaceRoot(),
        });
    }
    scheduleTarget(target, overrides = {}, scheduleOptions = {}) {
        return (0, schedule_by_name_1.scheduleByTarget)(target, overrides, {
            scheduler: this._scheduler,
            logger: scheduleOptions.logger || new core_1.logging.NullLogger(),
            currentDirectory: this._host.getCurrentDirectory(),
            workspaceRoot: this._host.getWorkspaceRoot(),
        });
    }
}
exports.Architect = Architect;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJjaGl0ZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYXJjaGl0ZWN0L3NyYy9hcmNoaXRlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXFEO0FBQ3JELCtCQWFjO0FBQ2QsK0JBUWU7QUFFZixpQ0FhZ0I7QUFDaEIseURBQXNFO0FBRXRFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ25ELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBRXJELFNBQVMsZ0NBQWdDLENBQ3ZDLElBQWlCLEVBQ2pCLE1BQTBCLEVBQzFCLElBQW1CLEVBQ25CLFFBQW9DLEVBQ3BDLFdBQTRCO0lBRTVCLE1BQU0sY0FBYyxHQUF1QjtRQUN6QyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUEsNEJBQXNCLEVBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVc7UUFDdkUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixLQUFLLEVBQUUsV0FBVztRQUNsQixNQUFNLEVBQUUsWUFBWTtRQUNwQixJQUFJO0tBQ0wsQ0FBQztJQUVGLFNBQVMsT0FBTyxDQUFDLFFBQXlCLEVBQUUsT0FBMEI7UUFDcEUsMkNBQTJDO1FBQzNDLE1BQU0sNkJBQTZCLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQzNELElBQUEsZ0JBQVMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDMUIsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLDRCQUFxQixDQUFDLEtBQUssRUFBRTtnQkFDaEQsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQXFCLENBQUM7Z0JBQ3hDLE1BQU0sT0FBTyxH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LFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMxQixNQUFNLEVBQUUsZUFBZSxDQUFDLE1BQU0sSUFBSSxJQUFJLGNBQU8sQ0FBQyxVQUFVLEVBQUU7WUFDMUQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRTtZQUNsRCxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtTQUM3QyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsY0FBYyxDQUNaLE1BQWMsRUFDZCxZQUE2QixFQUFFLEVBQy9CLGtCQUFtQyxFQUFFO1FBRXJDLE9BQU8sSUFBQSxtQ0FBZ0IsRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFFO1lBQ3pDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMxQixNQUFNLEVBQUUsZUFBZSxDQUFDLE1BQU0sSUFBSSxJQUFJLGNBQU8sQ0FBQyxVQUFVLEVBQUU7WUFDMUQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRTtZQUNsRCxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtTQUM3QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1REQsOEJBNERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpzb24sIGxvZ2dpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBPYnNlcnZhYmxlLFxuICBjb25jYXRNYXAsXG4gIGZpcnN0LFxuICBmcm9tLFxuICBpZ25vcmVFbGVtZW50cyxcbiAgbGFzdCxcbiAgbWFwLFxuICBtZXJnZSxcbiAgb2YsXG4gIG9uRXJyb3JSZXN1bWVOZXh0LFxuICBzaGFyZVJlcGxheSxcbiAgdGFrZVVudGlsLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIEJ1aWxkZXJJbmZvLFxuICBCdWlsZGVySW5wdXQsXG4gIEJ1aWxkZXJPdXRwdXQsXG4gIEJ1aWxkZXJSZWdpc3RyeSxcbiAgQnVpbGRlclJ1bixcbiAgVGFyZ2V0LFxuICB0YXJnZXRTdHJpbmdGcm9tVGFyZ2V0LFxufSBmcm9tICcuL2FwaSc7XG5pbXBvcnQgeyBBcmNoaXRlY3RIb3N0LCBCdWlsZGVyRGVzY3JpcHRpb24sIEJ1aWxkZXJKb2JIYW5kbGVyIH0gZnJvbSAnLi9pbnRlcm5hbCc7XG5pbXBvcnQge1xuICBGYWxsYmFja1JlZ2lzdHJ5LFxuICBKb2JIYW5kbGVyLFxuICBKb2JIYW5kbGVyQ29udGV4dCxcbiAgSm9iSW5ib3VuZE1lc3NhZ2UsXG4gIEpvYkluYm91bmRNZXNzYWdlS2luZCxcbiAgSm9iTmFtZSxcbiAgSm9iT3V0Ym91bmRNZXNzYWdlS2luZCxcbiAgUmVnaXN0cnksXG4gIFNjaGVkdWxlcixcbiAgU2ltcGxlSm9iUmVnaXN0cnksXG4gIFNpbXBsZVNjaGVkdWxlcixcbiAgY3JlYXRlSm9iSGFuZGxlcixcbn0gZnJvbSAnLi9qb2JzJztcbmltcG9ydCB7IHNjaGVkdWxlQnlOYW1lLCBzY2hlZHVsZUJ5VGFyZ2V0IH0gZnJvbSAnLi9zY2hlZHVsZS1ieS1uYW1lJztcblxuY29uc3QgaW5wdXRTY2hlbWEgPSByZXF1aXJlKCcuL2lucHV0LXNjaGVtYS5qc29uJyk7XG5jb25zdCBvdXRwdXRTY2hlbWEgPSByZXF1aXJlKCcuL291dHB1dC1zY2hlbWEuanNvbicpO1xuXG5mdW5jdGlvbiBfY3JlYXRlSm9iSGFuZGxlckZyb21CdWlsZGVySW5mbyhcbiAgaW5mbzogQnVpbGRlckluZm8sXG4gIHRhcmdldDogVGFyZ2V0IHwgdW5kZWZpbmVkLFxuICBob3N0OiBBcmNoaXRlY3RIb3N0LFxuICByZWdpc3RyeToganNvbi5zY2hlbWEuU2NoZW1hUmVnaXN0cnksXG4gIGJhc2VPcHRpb25zOiBqc29uLkpzb25PYmplY3QsXG4pOiBPYnNlcnZhYmxlPEJ1aWxkZXJKb2JIYW5kbGVyPiB7XG4gIGNvbnN0IGpvYkRlc2NyaXB0aW9uOiBCdWlsZGVyRGVzY3JpcHRpb24gPSB7XG4gICAgbmFtZTogdGFyZ2V0ID8gYHske3RhcmdldFN0cmluZ0Zyb21UYXJnZXQodGFyZ2V0KX19YCA6IGluZm8uYnVpbGRlck5hbWUsXG4gICAgYXJndW1lbnQ6IHsgdHlwZTogJ29iamVjdCcgfSxcbiAgICBpbnB1dDogaW5wdXRTY2hlbWEsXG4gICAgb3V0cHV0OiBvdXRwdXRTY2hlbWEsXG4gICAgaW5mbyxcbiAgfTtcblxuICBmdW5jdGlvbiBoYW5kbGVyKGFyZ3VtZW50OiBqc29uLkpzb25PYmplY3QsIGNvbnRleHQ6IEpvYkhhbmRsZXJDb250ZXh0KSB7XG4gICAgLy8gQWRkIGlucHV0IHZhbGlkYXRpb24gdG8gdGhlIGluYm91bmQgYnVzLlxuICAgIGNvbnN0IGluYm91bmRCdXNXaXRoSW5wdXRWYWxpZGF0aW9uID0gY29udGV4dC5pbmJvdW5kQnVzLnBpcGUoXG4gICAgICBjb25jYXRNYXAoYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uua2luZCA9PT0gSm9iSW5ib3VuZE1lc3NhZ2VLaW5kLklucHV0KSB7XG4gICAgICAgICAgY29uc3QgdiA9IG1lc3NhZ2UudmFsdWUgYXMgQnVpbGRlcklucHV0O1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAuLi5iYXNlT3B0aW9ucyxcbiAgICAgICAgICAgIC4uLnYub3B0aW9ucyxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gVmFsaWRhdGUgdiBhZ2FpbnN0IHRoZSBvcHRpb25zIHNjaGVtYS5cbiAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gYXdhaXQgcmVnaXN0cnkuY29tcGlsZShpbmZvLm9wdGlvblNjaGVtYSk7XG4gICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IGF3YWl0IHZhbGlkYXRpb24ob3B0aW9ucyk7XG4gICAgICAgICAgY29uc3QgeyBkYXRhLCBzdWNjZXNzLCBlcnJvcnMgfSA9IHZhbGlkYXRpb25SZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBqc29uLnNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uKGVycm9ycyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHsgLi4ubWVzc2FnZSwgdmFsdWU6IHsgLi4udiwgb3B0aW9uczogZGF0YSB9IH0gYXMgSm9iSW5ib3VuZE1lc3NhZ2U8QnVpbGRlcklucHV0PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbWVzc2FnZSBhcyBKb2JJbmJvdW5kTWVzc2FnZTxCdWlsZGVySW5wdXQ+O1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIC8vIFVzaW5nIGEgc2hhcmUgcmVwbGF5IGJlY2F1c2UgdGhlIGpvYiBtaWdodCBiZSBzeW5jaHJvbm91c2x5IHNlbmRpbmcgaW5wdXQsIGJ1dFxuICAgICAgLy8gYXN5bmNocm9ub3VzbHkgbGlzdGVuaW5nIHRvIGl0LlxuICAgICAgc2hhcmVSZXBsYXkoMSksXG4gICAgKTtcblxuICAgIC8vIE1ha2UgYW4gaW5ib3VuZEJ1cyB0aGF0IGNvbXBsZXRlcyBpbnN0ZWFkIG9mIGVycm9yaW5nIG91dC5cbiAgICAvLyBXZSdsbCBtZXJnZSB0aGUgZXJyb3JzIGludG8gdGhlIG91dHB1dCBpbnN0ZWFkLlxuICAgIGNvbnN0IGluYm91bmRCdXMgPSBvbkVycm9yUmVzdW1lTmV4dChpbmJvdW5kQnVzV2l0aElucHV0VmFsaWRhdGlvbik7XG5cbiAgICBjb25zdCBvdXRwdXQgPSBmcm9tKGhvc3QubG9hZEJ1aWxkZXIoaW5mbykpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKGJ1aWxkZXIpID0+IHtcbiAgICAgICAgaWYgKGJ1aWxkZXIgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBsb2FkIGJ1aWxkZXIgZm9yIGJ1aWxkZXJJbmZvICR7SlNPTi5zdHJpbmdpZnkoaW5mbywgbnVsbCwgMil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYnVpbGRlci5oYW5kbGVyKGFyZ3VtZW50LCB7IC4uLmNvbnRleHQsIGluYm91bmRCdXMgfSkucGlwZShcbiAgICAgICAgICBtYXAoKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5raW5kID09PSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLk91dHB1dCkge1xuICAgICAgICAgICAgICAvLyBBZGQgdGFyZ2V0IHRvIGl0LlxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLm91dHB1dCxcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgLi4ub3V0cHV0LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgLi4uKHRhcmdldCA/IHsgdGFyZ2V0IH0gOiAwKSxcbiAgICAgICAgICAgICAgICB9IGFzIHVua25vd24gYXMganNvbi5Kc29uT2JqZWN0LFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgLy8gU2hhcmUgc3Vic2NyaXB0aW9ucyB0byB0aGUgb3V0cHV0LCBvdGhlcndpc2UgdGhlIHRoZSBoYW5kbGVyIHdpbGwgYmUgcmUtcnVuLlxuICAgICAgc2hhcmVSZXBsYXkoKSxcbiAgICApO1xuXG4gICAgLy8gU2VwYXJhdGUgdGhlIGVycm9ycyBmcm9tIHRoZSBpbmJvdW5kIGJ1cyBpbnRvIHRoZWlyIG93biBvYnNlcnZhYmxlIHRoYXQgY29tcGxldGVzIHdoZW4gdGhlXG4gICAgLy8gYnVpbGRlciBvdXRwdXQgZG9lcy5cbiAgICBjb25zdCBpbmJvdW5kQnVzRXJyb3JzID0gaW5ib3VuZEJ1c1dpdGhJbnB1dFZhbGlkYXRpb24ucGlwZShcbiAgICAgIGlnbm9yZUVsZW1lbnRzKCksXG4gICAgICB0YWtlVW50aWwob25FcnJvclJlc3VtZU5leHQob3V0cHV0LnBpcGUobGFzdCgpKSkpLFxuICAgICk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIGJ1aWxkZXIgb3V0cHV0IHBsdXMgYW55IGlucHV0IGVycm9ycy5cbiAgICByZXR1cm4gbWVyZ2UoaW5ib3VuZEJ1c0Vycm9ycywgb3V0cHV0KTtcbiAgfVxuXG4gIHJldHVybiBvZihPYmplY3QuYXNzaWduKGhhbmRsZXIsIHsgam9iRGVzY3JpcHRpb24gfSkgYXMgQnVpbGRlckpvYkhhbmRsZXIpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjaGVkdWxlT3B0aW9ucyB7XG4gIGxvZ2dlcj86IGxvZ2dpbmcuTG9nZ2VyO1xufVxuXG4vKipcbiAqIEEgSm9iUmVnaXN0cnkgdGhhdCByZXNvbHZlcyBidWlsZGVyIHRhcmdldHMgZnJvbSB0aGUgaG9zdC5cbiAqL1xuY2xhc3MgQXJjaGl0ZWN0QnVpbGRlckpvYlJlZ2lzdHJ5IGltcGxlbWVudHMgQnVpbGRlclJlZ2lzdHJ5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9ob3N0OiBBcmNoaXRlY3RIb3N0LFxuICAgIHByb3RlY3RlZCBfcmVnaXN0cnk6IGpzb24uc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5LFxuICAgIHByb3RlY3RlZCBfam9iQ2FjaGU/OiBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPEJ1aWxkZXJKb2JIYW5kbGVyIHwgbnVsbD4+LFxuICAgIHByb3RlY3RlZCBfaW5mb0NhY2hlPzogTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxCdWlsZGVySW5mbyB8IG51bGw+PixcbiAgKSB7fVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZUJ1aWxkZXIobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxCdWlsZGVySW5mbyB8IG51bGw+IHtcbiAgICBjb25zdCBjYWNoZSA9IHRoaXMuX2luZm9DYWNoZTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIGNvbnN0IG1heWJlQ2FjaGUgPSBjYWNoZS5nZXQobmFtZSk7XG4gICAgICBpZiAobWF5YmVDYWNoZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtYXliZUNhY2hlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbmZvID0gZnJvbSh0aGlzLl9ob3N0LnJlc29sdmVCdWlsZGVyKG5hbWUpKS5waXBlKHNoYXJlUmVwbGF5KDEpKTtcbiAgICAgIGNhY2hlLnNldChuYW1lLCBpbmZvKTtcblxuICAgICAgcmV0dXJuIGluZm87XG4gICAgfVxuXG4gICAgcmV0dXJuIGZyb20odGhpcy5faG9zdC5yZXNvbHZlQnVpbGRlcihuYW1lKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NyZWF0ZUJ1aWxkZXIoXG4gICAgaW5mbzogQnVpbGRlckluZm8sXG4gICAgdGFyZ2V0PzogVGFyZ2V0LFxuICAgIG9wdGlvbnM/OiBqc29uLkpzb25PYmplY3QsXG4gICk6IE9ic2VydmFibGU8QnVpbGRlckpvYkhhbmRsZXIgfCBudWxsPiB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLl9qb2JDYWNoZTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICBjb25zdCBtYXliZUhpdCA9IGNhY2hlICYmIGNhY2hlLmdldCh0YXJnZXRTdHJpbmdGcm9tVGFyZ2V0KHRhcmdldCkpO1xuICAgICAgaWYgKG1heWJlSGl0KSB7XG4gICAgICAgIHJldHVybiBtYXliZUhpdDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF5YmVIaXQgPSBjYWNoZSAmJiBjYWNoZS5nZXQoaW5mby5idWlsZGVyTmFtZSk7XG4gICAgICBpZiAobWF5YmVIaXQpIHtcbiAgICAgICAgcmV0dXJuIG1heWJlSGl0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IF9jcmVhdGVKb2JIYW5kbGVyRnJvbUJ1aWxkZXJJbmZvKFxuICAgICAgaW5mbyxcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuX2hvc3QsXG4gICAgICB0aGlzLl9yZWdpc3RyeSxcbiAgICAgIG9wdGlvbnMgfHwge30sXG4gICAgKTtcblxuICAgIGlmIChjYWNoZSkge1xuICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICBjYWNoZS5zZXQodGFyZ2V0U3RyaW5nRnJvbVRhcmdldCh0YXJnZXQpLCByZXN1bHQucGlwZShzaGFyZVJlcGxheSgxKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FjaGUuc2V0KGluZm8uYnVpbGRlck5hbWUsIHJlc3VsdC5waXBlKHNoYXJlUmVwbGF5KDEpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGdldDxBIGV4dGVuZHMganNvbi5Kc29uT2JqZWN0LCBJIGV4dGVuZHMgQnVpbGRlcklucHV0LCBPIGV4dGVuZHMgQnVpbGRlck91dHB1dD4oXG4gICAgbmFtZTogc3RyaW5nLFxuICApOiBPYnNlcnZhYmxlPEpvYkhhbmRsZXI8QSwgSSwgTz4gfCBudWxsPiB7XG4gICAgY29uc3QgbSA9IG5hbWUubWF0Y2goL14oW146XSspOihbXjpdKykkL2kpO1xuICAgIGlmICghbSkge1xuICAgICAgcmV0dXJuIG9mKG51bGwpO1xuICAgIH1cblxuICAgIHJldHVybiBmcm9tKHRoaXMuX3Jlc29sdmVCdWlsZGVyKG5hbWUpKS5waXBlKFxuICAgICAgY29uY2F0TWFwKChidWlsZGVySW5mbykgPT4gKGJ1aWxkZXJJbmZvID8gdGhpcy5fY3JlYXRlQnVpbGRlcihidWlsZGVySW5mbykgOiBvZihudWxsKSkpLFxuICAgICAgZmlyc3QobnVsbCwgbnVsbCksXG4gICAgKSBhcyBPYnNlcnZhYmxlPEpvYkhhbmRsZXI8QSwgSSwgTz4gfCBudWxsPjtcbiAgfVxufVxuXG4vKipcbiAqIEEgSm9iUmVnaXN0cnkgdGhhdCByZXNvbHZlcyB0YXJnZXRzIGZyb20gdGhlIGhvc3QuXG4gKi9cbmNsYXNzIEFyY2hpdGVjdFRhcmdldEpvYlJlZ2lzdHJ5IGV4dGVuZHMgQXJjaGl0ZWN0QnVpbGRlckpvYlJlZ2lzdHJ5IHtcbiAgb3ZlcnJpZGUgZ2V0PEEgZXh0ZW5kcyBqc29uLkpzb25PYmplY3QsIEkgZXh0ZW5kcyBCdWlsZGVySW5wdXQsIE8gZXh0ZW5kcyBCdWlsZGVyT3V0cHV0PihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICk6IE9ic2VydmFibGU8Sm9iSGFuZGxlcjxBLCBJLCBPPiB8IG51bGw+IHtcbiAgICBjb25zdCBtID0gbmFtZS5tYXRjaCgvXnsoW146XSspOihbXjpdKykoPzo6KFteOl0qKSk/fSQvaSk7XG4gICAgaWYgKCFtKSB7XG4gICAgICByZXR1cm4gb2YobnVsbCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0ge1xuICAgICAgcHJvamVjdDogbVsxXSxcbiAgICAgIHRhcmdldDogbVsyXSxcbiAgICAgIGNvbmZpZ3VyYXRpb246IG1bM10sXG4gICAgfTtcblxuICAgIHJldHVybiBmcm9tKFxuICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLl9ob3N0LmdldEJ1aWxkZXJOYW1lRm9yVGFyZ2V0KHRhcmdldCksXG4gICAgICAgIHRoaXMuX2hvc3QuZ2V0T3B0aW9uc0ZvclRhcmdldCh0YXJnZXQpLFxuICAgICAgXSksXG4gICAgKS5waXBlKFxuICAgICAgY29uY2F0TWFwKChbYnVpbGRlclN0ciwgb3B0aW9uc10pID0+IHtcbiAgICAgICAgaWYgKGJ1aWxkZXJTdHIgPT09IG51bGwgfHwgb3B0aW9ucyA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBvZihudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9yZXNvbHZlQnVpbGRlcihidWlsZGVyU3RyKS5waXBlKFxuICAgICAgICAgIGNvbmNhdE1hcCgoYnVpbGRlckluZm8pID0+IHtcbiAgICAgICAgICAgIGlmIChidWlsZGVySW5mbyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm4gb2YobnVsbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVCdWlsZGVyKGJ1aWxkZXJJbmZvLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgICBmaXJzdChudWxsLCBudWxsKSxcbiAgICApIGFzIE9ic2VydmFibGU8Sm9iSGFuZGxlcjxBLCBJLCBPPiB8IG51bGw+O1xuICB9XG59XG5cbmZ1bmN0aW9uIF9nZXRUYXJnZXRPcHRpb25zRmFjdG9yeShob3N0OiBBcmNoaXRlY3RIb3N0KSB7XG4gIHJldHVybiBjcmVhdGVKb2JIYW5kbGVyPFRhcmdldCwganNvbi5Kc29uVmFsdWUsIGpzb24uSnNvbk9iamVjdD4oXG4gICAgKHRhcmdldCkgPT4ge1xuICAgICAgcmV0dXJuIGhvc3QuZ2V0T3B0aW9uc0ZvclRhcmdldCh0YXJnZXQpLnRoZW4oKG9wdGlvbnMpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdGFyZ2V0OiAke0pTT04uc3RyaW5naWZ5KHRhcmdldCl9LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICcuLmdldFRhcmdldE9wdGlvbnMnLFxuICAgICAgb3V0cHV0OiB7IHR5cGU6ICdvYmplY3QnIH0sXG4gICAgICBhcmd1bWVudDogaW5wdXRTY2hlbWEucHJvcGVydGllcy50YXJnZXQsXG4gICAgfSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gX2dldFByb2plY3RNZXRhZGF0YUZhY3RvcnkoaG9zdDogQXJjaGl0ZWN0SG9zdCkge1xuICByZXR1cm4gY3JlYXRlSm9iSGFuZGxlcjxUYXJnZXQsIGpzb24uSnNvblZhbHVlLCBqc29uLkpzb25PYmplY3Q+KFxuICAgICh0YXJnZXQpID0+IHtcbiAgICAgIHJldHVybiBob3N0LmdldFByb2plY3RNZXRhZGF0YSh0YXJnZXQpLnRoZW4oKG9wdGlvbnMpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdGFyZ2V0OiAke0pTT04uc3RyaW5naWZ5KHRhcmdldCl9LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICcuLmdldFByb2plY3RNZXRhZGF0YScsXG4gICAgICBvdXRwdXQ6IHsgdHlwZTogJ29iamVjdCcgfSxcbiAgICAgIGFyZ3VtZW50OiB7XG4gICAgICAgIG9uZU9mOiBbeyB0eXBlOiAnc3RyaW5nJyB9LCBpbnB1dFNjaGVtYS5wcm9wZXJ0aWVzLnRhcmdldF0sXG4gICAgICB9LFxuICAgIH0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIF9nZXRCdWlsZGVyTmFtZUZvclRhcmdldEZhY3RvcnkoaG9zdDogQXJjaGl0ZWN0SG9zdCkge1xuICByZXR1cm4gY3JlYXRlSm9iSGFuZGxlcjxUYXJnZXQsIG5ldmVyLCBzdHJpbmc+KFxuICAgIGFzeW5jICh0YXJnZXQpID0+IHtcbiAgICAgIGNvbnN0IGJ1aWxkZXJOYW1lID0gYXdhaXQgaG9zdC5nZXRCdWlsZGVyTmFtZUZvclRhcmdldCh0YXJnZXQpO1xuICAgICAgaWYgKCFidWlsZGVyTmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGJ1aWxkZXIgd2VyZSBmb3VuZCBmb3IgdGFyZ2V0ICR7dGFyZ2V0U3RyaW5nRnJvbVRhcmdldCh0YXJnZXQpfS5gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJ1aWxkZXJOYW1lO1xuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJy4uZ2V0QnVpbGRlck5hbWVGb3JUYXJnZXQnLFxuICAgICAgb3V0cHV0OiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICBhcmd1bWVudDogaW5wdXRTY2hlbWEucHJvcGVydGllcy50YXJnZXQsXG4gICAgfSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gX3ZhbGlkYXRlT3B0aW9uc0ZhY3RvcnkoaG9zdDogQXJjaGl0ZWN0SG9zdCwgcmVnaXN0cnk6IGpzb24uc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5KSB7XG4gIHJldHVybiBjcmVhdGVKb2JIYW5kbGVyPFtzdHJpbmcsIGpzb24uSnNvbk9iamVjdF0sIG5ldmVyLCBqc29uLkpzb25PYmplY3Q+KFxuICAgIGFzeW5jIChbYnVpbGRlck5hbWUsIG9wdGlvbnNdKSA9PiB7XG4gICAgICAvLyBHZXQgb3B0aW9uIHNjaGVtYSBmcm9tIHRoZSBob3N0LlxuICAgICAgY29uc3QgYnVpbGRlckluZm8gPSBhd2FpdCBob3N0LnJlc29sdmVCdWlsZGVyKGJ1aWxkZXJOYW1lKTtcbiAgICAgIGlmICghYnVpbGRlckluZm8pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBidWlsZGVyIGluZm8gd2VyZSBmb3VuZCBmb3IgYnVpbGRlciAke0pTT04uc3RyaW5naWZ5KGJ1aWxkZXJOYW1lKX0uYCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSBhd2FpdCByZWdpc3RyeS5jb21waWxlKGJ1aWxkZXJJbmZvLm9wdGlvblNjaGVtYSk7XG4gICAgICBjb25zdCB7IGRhdGEsIHN1Y2Nlc3MsIGVycm9ycyB9ID0gYXdhaXQgdmFsaWRhdGlvbihvcHRpb25zKTtcblxuICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgIHRocm93IG5ldyBqc29uLnNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uKGVycm9ycyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRhIGFzIGpzb24uSnNvbk9iamVjdDtcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICcuLnZhbGlkYXRlT3B0aW9ucycsXG4gICAgICBvdXRwdXQ6IHsgdHlwZTogJ29iamVjdCcgfSxcbiAgICAgIGFyZ3VtZW50OiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGl0ZW1zOiBbeyB0eXBlOiAnc3RyaW5nJyB9LCB7IHR5cGU6ICdvYmplY3QnIH1dLFxuICAgICAgfSxcbiAgICB9LFxuICApO1xufVxuXG5leHBvcnQgY2xhc3MgQXJjaGl0ZWN0IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfc2NoZWR1bGVyOiBTY2hlZHVsZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2pvYkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8QnVpbGRlckpvYkhhbmRsZXI+PigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9pbmZvQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxCdWlsZGVySW5mbz4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfaG9zdDogQXJjaGl0ZWN0SG9zdCxcbiAgICByZWdpc3RyeToganNvbi5zY2hlbWEuU2NoZW1hUmVnaXN0cnkgPSBuZXcganNvbi5zY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KCksXG4gICAgYWRkaXRpb25hbEpvYlJlZ2lzdHJ5PzogUmVnaXN0cnksXG4gICkge1xuICAgIGNvbnN0IHByaXZhdGVBcmNoaXRlY3RKb2JSZWdpc3RyeSA9IG5ldyBTaW1wbGVKb2JSZWdpc3RyeSgpO1xuICAgIC8vIENyZWF0ZSBwcml2YXRlIGpvYnMuXG4gICAgcHJpdmF0ZUFyY2hpdGVjdEpvYlJlZ2lzdHJ5LnJlZ2lzdGVyKF9nZXRUYXJnZXRPcHRpb25zRmFjdG9yeShfaG9zdCkpO1xuICAgIHByaXZhdGVBcmNoaXRlY3RKb2JSZWdpc3RyeS5yZWdpc3RlcihfZ2V0QnVpbGRlck5hbWVGb3JUYXJnZXRGYWN0b3J5KF9ob3N0KSk7XG4gICAgcHJpdmF0ZUFyY2hpdGVjdEpvYlJlZ2lzdHJ5LnJlZ2lzdGVyKF92YWxpZGF0ZU9wdGlvbnNGYWN0b3J5KF9ob3N0LCByZWdpc3RyeSkpO1xuICAgIHByaXZhdGVBcmNoaXRlY3RKb2JSZWdpc3RyeS5yZWdpc3RlcihfZ2V0UHJvamVjdE1ldGFkYXRhRmFjdG9yeShfaG9zdCkpO1xuXG4gICAgY29uc3Qgam9iUmVnaXN0cnkgPSBuZXcgRmFsbGJhY2tSZWdpc3RyeShbXG4gICAgICBuZXcgQXJjaGl0ZWN0VGFyZ2V0Sm9iUmVnaXN0cnkoX2hvc3QsIHJlZ2lzdHJ5LCB0aGlzLl9qb2JDYWNoZSwgdGhpcy5faW5mb0NhY2hlKSxcbiAgICAgIG5ldyBBcmNoaXRlY3RCdWlsZGVySm9iUmVnaXN0cnkoX2hvc3QsIHJlZ2lzdHJ5LCB0aGlzLl9qb2JDYWNoZSwgdGhpcy5faW5mb0NhY2hlKSxcbiAgICAgIHByaXZhdGVBcmNoaXRlY3RKb2JSZWdpc3RyeSxcbiAgICAgIC4uLihhZGRpdGlvbmFsSm9iUmVnaXN0cnkgPyBbYWRkaXRpb25hbEpvYlJlZ2lzdHJ5XSA6IFtdKSxcbiAgICBdIGFzIFJlZ2lzdHJ5W10pO1xuXG4gICAgdGhpcy5fc2NoZWR1bGVyID0gbmV3IFNpbXBsZVNjaGVkdWxlcihqb2JSZWdpc3RyeSwgcmVnaXN0cnkpO1xuICB9XG5cbiAgaGFzKG5hbWU6IEpvYk5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5fc2NoZWR1bGVyLmhhcyhuYW1lKTtcbiAgfVxuXG4gIHNjaGVkdWxlQnVpbGRlcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczoganNvbi5Kc29uT2JqZWN0LFxuICAgIHNjaGVkdWxlT3B0aW9uczogU2NoZWR1bGVPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8QnVpbGRlclJ1bj4ge1xuICAgIC8vIFRoZSBiZWxvdyB3aWxsIG1hdGNoICdwcm9qZWN0OnRhcmdldDpjb25maWd1cmF0aW9uJ1xuICAgIGlmICghL15bXjpdKzpbXjpdKyg6W146XSspPyQvLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBidWlsZGVyIG5hbWU6ICcgKyBKU09OLnN0cmluZ2lmeShuYW1lKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVkdWxlQnlOYW1lKG5hbWUsIG9wdGlvbnMsIHtcbiAgICAgIHNjaGVkdWxlcjogdGhpcy5fc2NoZWR1bGVyLFxuICAgICAgbG9nZ2VyOiBzY2hlZHVsZU9wdGlvbnMubG9nZ2VyIHx8IG5ldyBsb2dnaW5nLk51bGxMb2dnZXIoKSxcbiAgICAgIGN1cnJlbnREaXJlY3Rvcnk6IHRoaXMuX2hvc3QuZ2V0Q3VycmVudERpcmVjdG9yeSgpLFxuICAgICAgd29ya3NwYWNlUm9vdDogdGhpcy5faG9zdC5nZXRXb3Jrc3BhY2VSb290KCksXG4gICAgfSk7XG4gIH1cbiAgc2NoZWR1bGVUYXJnZXQoXG4gICAgdGFyZ2V0OiBUYXJnZXQsXG4gICAgb3ZlcnJpZGVzOiBqc29uLkpzb25PYmplY3QgPSB7fSxcbiAgICBzY2hlZHVsZU9wdGlvbnM6IFNjaGVkdWxlT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPEJ1aWxkZXJSdW4+IHtcbiAgICByZXR1cm4gc2NoZWR1bGVCeVRhcmdldCh0YXJnZXQsIG92ZXJyaWRlcywge1xuICAgICAgc2NoZWR1bGVyOiB0aGlzLl9zY2hlZHVsZXIsXG4gICAgICBsb2dnZXI6IHNjaGVkdWxlT3B0aW9ucy5sb2dnZXIgfHwgbmV3IGxvZ2dpbmcuTnVsbExvZ2dlcigpLFxuICAgICAgY3VycmVudERpcmVjdG9yeTogdGhpcy5faG9zdC5nZXRDdXJyZW50RGlyZWN0b3J5KCksXG4gICAgICB3b3Jrc3BhY2VSb290OiB0aGlzLl9ob3N0LmdldFdvcmtzcGFjZVJvb3QoKSxcbiAgICB9KTtcbiAgfVxufVxuIl19