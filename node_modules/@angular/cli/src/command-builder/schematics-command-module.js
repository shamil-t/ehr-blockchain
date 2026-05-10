"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicsCommandModule = exports.DEFAULT_SCHEMATICS_COLLECTION = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const path_1 = require("path");
const analytics_1 = require("../analytics/analytics");
const analytics_parameters_1 = require("../analytics/analytics-parameters");
const config_1 = require("../utilities/config");
const error_1 = require("../utilities/error");
const memoize_1 = require("../utilities/memoize");
const tty_1 = require("../utilities/tty");
const command_module_1 = require("./command-module");
const json_schema_1 = require("./utilities/json-schema");
const schematic_engine_host_1 = require("./utilities/schematic-engine-host");
const schematic_workflow_1 = require("./utilities/schematic-workflow");
exports.DEFAULT_SCHEMATICS_COLLECTION = '@schematics/angular';
class SchematicsCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.scope = command_module_1.CommandScope.In;
        this.allowPrivateSchematics = false;
    }
    async builder(argv) {
        return argv
            .option('interactive', {
            describe: 'Enable interactive input prompts.',
            type: 'boolean',
            default: true,
        })
            .option('dry-run', {
            describe: 'Run through and reports activity without writing out results.',
            type: 'boolean',
            default: false,
        })
            .option('defaults', {
            describe: 'Disable interactive input prompts for options with a default.',
            type: 'boolean',
            default: false,
        })
            .option('force', {
            describe: 'Force overwriting of existing files.',
            type: 'boolean',
            default: false,
        })
            .strict();
    }
    /** Get schematic schema options.*/
    async getSchematicOptions(collection, schematicName, workflow) {
        const schematic = collection.createSchematic(schematicName, true);
        const { schemaJson } = schematic.description;
        if (!schemaJson) {
            return [];
        }
        return (0, json_schema_1.parseJsonSchemaToOptions)(workflow.registry, schemaJson);
    }
    getOrCreateWorkflowForBuilder(collectionName) {
        return new tools_1.NodeWorkflow(this.context.root, {
            resolvePaths: this.getResolvePaths(collectionName),
            engineHostCreator: (options) => new schematic_engine_host_1.SchematicEngineHost(options.resolvePaths),
        });
    }
    async getOrCreateWorkflowForExecution(collectionName, options) {
        const { logger, root, packageManager } = this.context;
        const { force, dryRun, packageRegistry } = options;
        const workflow = new tools_1.NodeWorkflow(root, {
            force,
            dryRun,
            packageManager: packageManager.name,
            // A schema registry is required to allow customizing addUndefinedDefaults
            registry: new core_1.schema.CoreSchemaRegistry(schematics_1.formats.standardFormats),
            packageRegistry,
            resolvePaths: this.getResolvePaths(collectionName),
            schemaValidation: true,
            optionTransforms: [
                // Add configuration file defaults
                async (schematic, current) => {
                    const projectName = typeof current?.project === 'string' ? current.project : this.getProjectName();
                    return {
                        ...(await (0, config_1.getSchematicDefaults)(schematic.collection.name, schematic.name, projectName)),
                        ...current,
                    };
                },
            ],
            engineHostCreator: (options) => new schematic_engine_host_1.SchematicEngineHost(options.resolvePaths),
        });
        workflow.registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        workflow.registry.useXDeprecatedProvider((msg) => logger.warn(msg));
        workflow.registry.addSmartDefaultProvider('projectName', () => this.getProjectName());
        const workingDir = (0, core_1.normalize)((0, path_1.relative)(this.context.root, process.cwd()));
        workflow.registry.addSmartDefaultProvider('workingDirectory', () => workingDir === '' ? undefined : workingDir);
        let shouldReportAnalytics = true;
        workflow.engineHost.registerOptionsTransform(async (schematic, options) => {
            // Report analytics
            if (shouldReportAnalytics) {
                shouldReportAnalytics = false;
                const { collection: { name: collectionName }, name: schematicName, } = schematic;
                const analytics = (0, analytics_1.isPackageNameSafeForAnalytics)(collectionName)
                    ? await this.getAnalytics()
                    : undefined;
                analytics?.reportSchematicRunEvent({
                    [analytics_parameters_1.EventCustomDimension.SchematicCollectionName]: collectionName,
                    [analytics_parameters_1.EventCustomDimension.SchematicName]: schematicName,
                    ...this.getAnalyticsParameters(options),
                });
            }
            return options;
        });
        if (options.interactive !== false && (0, tty_1.isTTY)()) {
            workflow.registry.usePromptProvider(async (definitions) => {
                const questions = definitions
                    .filter((definition) => !options.defaults || definition.default === undefined)
                    .map((definition) => {
                    const question = {
                        name: definition.id,
                        message: definition.message,
                        default: definition.default,
                    };
                    const validator = definition.validator;
                    if (validator) {
                        question.validate = (input) => validator(input);
                        // Filter allows transformation of the value prior to validation
                        question.filter = async (input) => {
                            for (const type of definition.propertyTypes) {
                                let value;
                                switch (type) {
                                    case 'string':
                                        value = String(input);
                                        break;
                                    case 'integer':
                                    case 'number':
                                        value = Number(input);
                                        break;
                                    default:
                                        value = input;
                                        break;
                                }
                                // Can be a string if validation fails
                                const isValid = (await validator(value)) === true;
                                if (isValid) {
                                    return value;
                                }
                            }
                            return input;
                        };
                    }
                    switch (definition.type) {
                        case 'confirmation':
                            question.type = 'confirm';
                            break;
                        case 'list':
                            question.type = definition.multiselect ? 'checkbox' : 'list';
                            question.choices = definition.items?.map((item) => {
                                return typeof item == 'string'
                                    ? item
                                    : {
                                        name: item.label,
                                        value: item.value,
                                    };
                            });
                            break;
                        default:
                            question.type = definition.type;
                            break;
                    }
                    return question;
                });
                if (questions.length) {
                    const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
                    return prompt(questions);
                }
                else {
                    return {};
                }
            });
        }
        return workflow;
    }
    async getSchematicCollections() {
        // Resolve relative collections from the location of `angular.json`
        const resolveRelativeCollection = (collectionName) => collectionName.charAt(0) === '.'
            ? (0, path_1.resolve)(this.context.root, collectionName)
            : collectionName;
        const getSchematicCollections = (configSection) => {
            if (!configSection) {
                return undefined;
            }
            const { schematicCollections } = configSection;
            if (Array.isArray(schematicCollections)) {
                return new Set(schematicCollections.map((c) => resolveRelativeCollection(c)));
            }
            return undefined;
        };
        const { workspace, globalConfiguration } = this.context;
        if (workspace) {
            const project = (0, config_1.getProjectByCwd)(workspace);
            if (project) {
                const value = getSchematicCollections(workspace.getProjectCli(project));
                if (value) {
                    return value;
                }
            }
        }
        const value = getSchematicCollections(workspace?.getCli()) ??
            getSchematicCollections(globalConfiguration.getCli());
        if (value) {
            return value;
        }
        return new Set([exports.DEFAULT_SCHEMATICS_COLLECTION]);
    }
    parseSchematicInfo(schematic) {
        if (schematic?.includes(':')) {
            const [collectionName, schematicName] = schematic.split(':', 2);
            return [collectionName, schematicName];
        }
        return [undefined, schematic];
    }
    async runSchematic(options) {
        const { logger } = this.context;
        const { schematicOptions, executionOptions, collectionName, schematicName } = options;
        const workflow = await this.getOrCreateWorkflowForExecution(collectionName, executionOptions);
        if (!schematicName) {
            throw new Error('schematicName cannot be undefined.');
        }
        const { unsubscribe, files } = (0, schematic_workflow_1.subscribeToWorkflow)(workflow, logger);
        try {
            await workflow
                .execute({
                collection: collectionName,
                schematic: schematicName,
                options: schematicOptions,
                logger,
                allowPrivate: this.allowPrivateSchematics,
            })
                .toPromise();
            if (!files.size) {
                logger.info('Nothing to be done.');
            }
            if (executionOptions.dryRun) {
                logger.warn(`\nNOTE: The "--dry-run" option means no changes were made.`);
            }
        }
        catch (err) {
            // In case the workflow was not successful, show an appropriate error message.
            if (err instanceof schematics_1.UnsuccessfulWorkflowExecution) {
                // "See above" because we already printed the error.
                logger.fatal('The Schematic workflow failed. See above.');
            }
            else {
                (0, error_1.assertIsError)(err);
                logger.fatal(err.message);
            }
            return 1;
        }
        finally {
            unsubscribe();
        }
        return 0;
    }
    getProjectName() {
        const { workspace, logger } = this.context;
        if (!workspace) {
            return undefined;
        }
        const projectName = (0, config_1.getProjectByCwd)(workspace);
        if (projectName) {
            return projectName;
        }
        return undefined;
    }
    getResolvePaths(collectionName) {
        const { workspace, root } = this.context;
        return workspace
            ? // Workspace
                collectionName === exports.DEFAULT_SCHEMATICS_COLLECTION
                    ? // Favor __dirname for @schematics/angular to use the build-in version
                        [__dirname, process.cwd(), root]
                    : [process.cwd(), root, __dirname]
            : // Global
                [__dirname, process.cwd()];
    }
}
exports.SchematicsCommandModule = SchematicsCommandModule;
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", tools_1.NodeWorkflow)
], SchematicsCommandModule.prototype, "getOrCreateWorkflowForBuilder", null);
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SchematicsCommandModule.prototype, "getOrCreateWorkflowForExecution", null);
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchematicsCommandModule.prototype, "getSchematicCollections", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljcy1jb21tYW5kLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy9jb21tYW5kLWJ1aWxkZXIvc2NoZW1hdGljcy1jb21tYW5kLW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUE0RTtBQUM1RSwyREFBZ0c7QUFDaEcsNERBSTBDO0FBRTFDLCtCQUF5QztBQUV6QyxzREFBdUU7QUFDdkUsNEVBQXlFO0FBQ3pFLGdEQUE0RTtBQUM1RSw4Q0FBbUQ7QUFDbkQsa0RBQStDO0FBQy9DLDBDQUF5QztBQUN6QyxxREFNMEI7QUFDMUIseURBQTJFO0FBQzNFLDZFQUF3RTtBQUN4RSx1RUFBcUU7QUFFeEQsUUFBQSw2QkFBNkIsR0FBRyxxQkFBcUIsQ0FBQztBQWFuRSxNQUFzQix1QkFDcEIsU0FBUSw4QkFBb0M7SUFEOUM7O1FBSVcsVUFBSyxHQUFHLDZCQUFZLENBQUMsRUFBRSxDQUFDO1FBQ2QsMkJBQXNCLEdBQVksS0FBSyxDQUFDO0lBeVU3RCxDQUFDO0lBdlVDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBVTtRQUN0QixPQUFPLElBQUk7YUFDUixNQUFNLENBQUMsYUFBYSxFQUFFO1lBQ3JCLFFBQVEsRUFBRSxtQ0FBbUM7WUFDN0MsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUM7YUFDRCxNQUFNLENBQUMsU0FBUyxFQUFFO1lBQ2pCLFFBQVEsRUFBRSwrREFBK0Q7WUFDekUsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztTQUNmLENBQUM7YUFDRCxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ2xCLFFBQVEsRUFBRSwrREFBK0Q7WUFDekUsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFP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UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRU8sZUFBZSxDQUFDLGNBQXNCO1FBQzVDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUV6QyxPQUFPLFNBQVM7WUFDZCxDQUFDLENBQUMsWUFBWTtnQkFDWixjQUFjLEtBQUsscUNBQTZCO29CQUNoRCxDQUFDLENBQUMsc0VBQXNFO3dCQUN0RSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDO29CQUNsQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQztZQUNwQyxDQUFDLENBQUMsU0FBUztnQkFDVCxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUE5VUQsMERBOFVDO0FBN1JXO0lBRFQsaUJBQU87OztvQ0FDeUQsb0JBQVk7NEVBSzVFO0FBR2U7SUFEZixpQkFBTzs7Ozs4RUE4SVA7QUFHZTtJQURmLGlCQUFPOzs7O3NFQTBDUCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBub3JtYWxpemUgYXMgZGV2a2l0Tm9ybWFsaXplLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBDb2xsZWN0aW9uLCBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbiwgZm9ybWF0cyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgTm9kZVdvcmtmbG93LFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgdHlwZSB7IENoZWNrYm94UXVlc3Rpb24sIFF1ZXN0aW9uIH0gZnJvbSAnaW5xdWlyZXInO1xuaW1wb3J0IHsgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFyZ3YgfSBmcm9tICd5YXJncyc7XG5pbXBvcnQgeyBpc1BhY2thZ2VOYW1lU2FmZUZvckFuYWx5dGljcyB9IGZyb20gJy4uL2FuYWx5dGljcy9hbmFseXRpY3MnO1xuaW1wb3J0IHsgRXZlbnRDdXN0b21EaW1lbnNpb24gfSBmcm9tICcuLi9hbmFseXRpY3MvYW5hbHl0aWNzLXBhcmFtZXRlcnMnO1xuaW1wb3J0IHsgZ2V0UHJvamVjdEJ5Q3dkLCBnZXRTY2hlbWF0aWNEZWZhdWx0cyB9IGZyb20gJy4uL3V0aWxpdGllcy9jb25maWcnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uL3V0aWxpdGllcy9lcnJvcic7XG5pbXBvcnQgeyBtZW1vaXplIH0gZnJvbSAnLi4vdXRpbGl0aWVzL21lbW9pemUnO1xuaW1wb3J0IHsgaXNUVFkgfSBmcm9tICcuLi91dGlsaXRpZXMvdHR5JztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGUsXG4gIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbixcbiAgQ29tbWFuZFNjb3BlLFxuICBPcHRpb25zLFxuICBPdGhlck9wdGlvbnMsXG59IGZyb20gJy4vY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHsgT3B0aW9uLCBwYXJzZUpzb25TY2hlbWFUb09wdGlvbnMgfSBmcm9tICcuL3V0aWxpdGllcy9qc29uLXNjaGVtYSc7XG5pbXBvcnQgeyBTY2hlbWF0aWNFbmdpbmVIb3N0IH0gZnJvbSAnLi91dGlsaXRpZXMvc2NoZW1hdGljLWVuZ2luZS1ob3N0JztcbmltcG9ydCB7IHN1YnNjcmliZVRvV29ya2Zsb3cgfSBmcm9tICcuL3V0aWxpdGllcy9zY2hlbWF0aWMtd29ya2Zsb3cnO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TQ0hFTUFUSUNTX0NPTExFQ1RJT04gPSAnQHNjaGVtYXRpY3MvYW5ndWxhcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NoZW1hdGljc0NvbW1hbmRBcmdzIHtcbiAgaW50ZXJhY3RpdmU6IGJvb2xlYW47XG4gIGZvcmNlOiBib29sZWFuO1xuICAnZHJ5LXJ1bic6IGJvb2xlYW47XG4gIGRlZmF1bHRzOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjaGVtYXRpY3NFeGVjdXRpb25PcHRpb25zIGV4dGVuZHMgT3B0aW9uczxTY2hlbWF0aWNzQ29tbWFuZEFyZ3M+IHtcbiAgcGFja2FnZVJlZ2lzdHJ5Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2NoZW1hdGljc0NvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBDb21tYW5kTW9kdWxlPFNjaGVtYXRpY3NDb21tYW5kQXJncz5cbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb248U2NoZW1hdGljc0NvbW1hbmRBcmdzPlxue1xuICBvdmVycmlkZSBzY29wZSA9IENvbW1hbmRTY29wZS5JbjtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGFsbG93UHJpdmF0ZVNjaGVtYXRpY3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBhc3luYyBidWlsZGVyKGFyZ3Y6IEFyZ3YpOiBQcm9taXNlPEFyZ3Y8U2NoZW1hdGljc0NvbW1hbmRBcmdzPj4ge1xuICAgIHJldHVybiBhcmd2XG4gICAgICAub3B0aW9uKCdpbnRlcmFjdGl2ZScsIHtcbiAgICAgICAgZGVzY3JpYmU6ICdFbmFibGUgaW50ZXJhY3RpdmUgaW5wdXQgcHJvbXB0cy4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICB9KVxuICAgICAgLm9wdGlvbignZHJ5LXJ1bicsIHtcbiAgICAgICAgZGVzY3JpYmU6ICdSdW4gdGhyb3VnaCBhbmQgcmVwb3J0cyBhY3Rpdml0eSB3aXRob3V0IHdyaXRpbmcgb3V0IHJlc3VsdHMuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCdkZWZhdWx0cycsIHtcbiAgICAgICAgZGVzY3JpYmU6ICdEaXNhYmxlIGludGVyYWN0aXZlIGlucHV0IHByb21wdHMgZm9yIG9wdGlvbnMgd2l0aCBhIGRlZmF1bHQuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCdmb3JjZScsIHtcbiAgICAgICAgZGVzY3JpYmU6ICdGb3JjZSBvdmVyd3JpdGluZyBvZiBleGlzdGluZyBmaWxlcy4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSlcbiAgICAgIC5zdHJpY3QoKTtcbiAgfVxuXG4gIC8qKiBHZXQgc2NoZW1hdGljIHNjaGVtYSBvcHRpb25zLiovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTY2hlbWF0aWNPcHRpb25zKFxuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb248RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uPixcbiAgICBzY2hlbWF0aWNOYW1lOiBzdHJpbmcsXG4gICAgd29ya2Zsb3c6IE5vZGVXb3JrZmxvdyxcbiAgKTogUHJvbWlzZTxPcHRpb25bXT4ge1xuICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKHNjaGVtYXRpY05hbWUsIHRydWUpO1xuICAgIGNvbnN0IHsgc2NoZW1hSnNvbiB9ID0gc2NoZW1hdGljLmRlc2NyaXB0aW9uO1xuXG4gICAgaWYgKCFzY2hlbWFKc29uKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyh3b3JrZmxvdy5yZWdpc3RyeSwgc2NoZW1hSnNvbik7XG4gIH1cblxuICBAbWVtb2l6ZVxuICBwcm90ZWN0ZWQgZ2V0T3JDcmVhdGVXb3JrZmxvd0ZvckJ1aWxkZXIoY29sbGVjdGlvbk5hbWU6IHN0cmluZyk6IE5vZGVXb3JrZmxvdyB7XG4gICAgcmV0dXJuIG5ldyBOb2RlV29ya2Zsb3codGhpcy5jb250ZXh0LnJvb3QsIHtcbiAgICAgIHJlc29sdmVQYXRoczogdGhpcy5nZXRSZXNvbHZlUGF0aHMoY29sbGVjdGlvbk5hbWUpLFxuICAgICAgZW5naW5lSG9zdENyZWF0b3I6IChvcHRpb25zKSA9PiBuZXcgU2NoZW1hdGljRW5naW5lSG9zdChvcHRpb25zLnJlc29sdmVQYXRocyksXG4gICAgfSk7XG4gIH1cblxuICBAbWVtb2l6ZVxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3JDcmVhdGVXb3JrZmxvd0ZvckV4ZWN1dGlvbihcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFNjaGVtYXRpY3NFeGVjdXRpb25PcHRpb25zLFxuICApOiBQcm9taXNlPE5vZGVXb3JrZmxvdz4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyLCByb290LCBwYWNrYWdlTWFuYWdlciB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHsgZm9yY2UsIGRyeVJ1biwgcGFja2FnZVJlZ2lzdHJ5IH0gPSBvcHRpb25zO1xuXG4gICAgY29uc3Qgd29ya2Zsb3cgPSBuZXcgTm9kZVdvcmtmbG93KHJvb3QsIHtcbiAgICAgIGZvcmNlLFxuICAgICAgZHJ5UnVuLFxuICAgICAgcGFja2FnZU1hbmFnZXI6IHBhY2thZ2VNYW5hZ2VyLm5hbWUsXG4gICAgICAvLyBBIHNjaGVtYSByZWdpc3RyeSBpcyByZXF1aXJlZCB0byBhbGxvdyBjdXN0b21pemluZyBhZGRVbmRlZmluZWREZWZhdWx0c1xuICAgICAgcmVnaXN0cnk6IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KGZvcm1hdHMuc3RhbmRhcmRGb3JtYXRzKSxcbiAgICAgIHBhY2thZ2VSZWdpc3RyeSxcbiAgICAgIHJlc29sdmVQYXRoczogdGhpcy5nZXRSZXNvbHZlUGF0aHMoY29sbGVjdGlvbk5hbWUpLFxuICAgICAgc2NoZW1hVmFsaWRhdGlvbjogdHJ1ZSxcbiAgICAgIG9wdGlvblRyYW5zZm9ybXM6IFtcbiAgICAgICAgLy8gQWRkIGNvbmZpZ3VyYXRpb24gZmlsZSBkZWZhdWx0c1xuICAgICAgICBhc3luYyAoc2NoZW1hdGljLCBjdXJyZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPVxuICAgICAgICAgICAgdHlwZW9mIGN1cnJlbnQ/LnByb2plY3QgPT09ICdzdHJpbmcnID8gY3VycmVudC5wcm9qZWN0IDogdGhpcy5nZXRQcm9qZWN0TmFtZSgpO1xuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLihhd2FpdCBnZXRTY2hlbWF0aWNEZWZhdWx0cyhzY2hlbWF0aWMuY29sbGVjdGlvbi5uYW1lLCBzY2hlbWF0aWMubmFtZSwgcHJvamVjdE5hbWUpKSxcbiAgICAgICAgICAgIC4uLmN1cnJlbnQsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBlbmdpbmVIb3N0Q3JlYXRvcjogKG9wdGlvbnMpID0+IG5ldyBTY2hlbWF0aWNFbmdpbmVIb3N0KG9wdGlvbnMucmVzb2x2ZVBhdGhzKSxcbiAgICB9KTtcblxuICAgIHdvcmtmbG93LnJlZ2lzdHJ5LmFkZFBvc3RUcmFuc2Zvcm0oc2NoZW1hLnRyYW5zZm9ybXMuYWRkVW5kZWZpbmVkRGVmYXVsdHMpO1xuICAgIHdvcmtmbG93LnJlZ2lzdHJ5LnVzZVhEZXByZWNhdGVkUHJvdmlkZXIoKG1zZykgPT4gbG9nZ2VyLndhcm4obXNnKSk7XG4gICAgd29ya2Zsb3cucmVnaXN0cnkuYWRkU21hcnREZWZhdWx0UHJvdmlkZXIoJ3Byb2plY3ROYW1lJywgKCkgPT4gdGhpcy5nZXRQcm9qZWN0TmFtZSgpKTtcblxuICAgIGNvbnN0IHdvcmtpbmdEaXIgPSBkZXZraXROb3JtYWxpemUocmVsYXRpdmUodGhpcy5jb250ZXh0LnJvb3QsIHByb2Nlc3MuY3dkKCkpKTtcbiAgICB3b3JrZmxvdy5yZWdpc3RyeS5hZGRTbWFydERlZmF1bHRQcm92aWRlcignd29ya2luZ0RpcmVjdG9yeScsICgpID0+XG4gICAgICB3b3JraW5nRGlyID09PSAnJyA/IHVuZGVmaW5lZCA6IHdvcmtpbmdEaXIsXG4gICAgKTtcblxuICAgIGxldCBzaG91bGRSZXBvcnRBbmFseXRpY3MgPSB0cnVlO1xuICAgIHdvcmtmbG93LmVuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKGFzeW5jIChzY2hlbWF0aWMsIG9wdGlvbnMpID0+IHtcbiAgICAgIC8vIFJlcG9ydCBhbmFseXRpY3NcbiAgICAgIGlmIChzaG91bGRSZXBvcnRBbmFseXRpY3MpIHtcbiAgICAgICAgc2hvdWxkUmVwb3J0QW5hbHl0aWNzID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGNvbGxlY3Rpb246IHsgbmFtZTogY29sbGVjdGlvbk5hbWUgfSxcbiAgICAgICAgICBuYW1lOiBzY2hlbWF0aWNOYW1lLFxuICAgICAgICB9ID0gc2NoZW1hdGljO1xuXG4gICAgICAgIGNvbnN0IGFuYWx5dGljcyA9IGlzUGFja2FnZU5hbWVTYWZlRm9yQW5hbHl0aWNzKGNvbGxlY3Rpb25OYW1lKVxuICAgICAgICAgID8gYXdhaXQgdGhpcy5nZXRBbmFseXRpY3MoKVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIGFuYWx5dGljcz8ucmVwb3J0U2NoZW1hdGljUnVuRXZlbnQoe1xuICAgICAgICAgIFtFdmVudEN1c3RvbURpbWVuc2lvbi5TY2hlbWF0aWNDb2xsZWN0aW9uTmFtZV06IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAgIFtFdmVudEN1c3RvbURpbWVuc2lvbi5TY2hlbWF0aWNOYW1lXTogc2NoZW1hdGljTmFtZSxcbiAgICAgICAgICAuLi50aGlzLmdldEFuYWx5dGljc1BhcmFtZXRlcnMob3B0aW9ucyBhcyB1bmtub3duIGFzIHt9KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH0pO1xuXG4gICAgaWYgKG9wdGlvbnMuaW50ZXJhY3RpdmUgIT09IGZhbHNlICYmIGlzVFRZKCkpIHtcbiAgICAgIHdvcmtmbG93LnJlZ2lzdHJ5LnVzZVByb21wdFByb3ZpZGVyKGFzeW5jIChkZWZpbml0aW9uczogQXJyYXk8c2NoZW1hLlByb21wdERlZmluaXRpb24+KSA9PiB7XG4gICAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IGRlZmluaXRpb25zXG4gICAgICAgICAgLmZpbHRlcigoZGVmaW5pdGlvbikgPT4gIW9wdGlvbnMuZGVmYXVsdHMgfHwgZGVmaW5pdGlvbi5kZWZhdWx0ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgLm1hcCgoZGVmaW5pdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb246IFF1ZXN0aW9uID0ge1xuICAgICAgICAgICAgICBuYW1lOiBkZWZpbml0aW9uLmlkLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBkZWZpbml0aW9uLm1lc3NhZ2UsXG4gICAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmluaXRpb24uZGVmYXVsdCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGRlZmluaXRpb24udmFsaWRhdG9yO1xuICAgICAgICAgICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgICAgICAgICBxdWVzdGlvbi52YWxpZGF0ZSA9IChpbnB1dCkgPT4gdmFsaWRhdG9yKGlucHV0KTtcblxuICAgICAgICAgICAgICAvLyBGaWx0ZXIgYWxsb3dzIHRyYW5zZm9ybWF0aW9uIG9mIHRoZSB2YWx1ZSBwcmlvciB0byB2YWxpZGF0aW9uXG4gICAgICAgICAgICAgIHF1ZXN0aW9uLmZpbHRlciA9IGFzeW5jIChpbnB1dCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBkZWZpbml0aW9uLnByb3BlcnR5VHlwZXMpIHtcbiAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW50ZWdlcic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIoaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBDYW4gYmUgYSBzdHJpbmcgaWYgdmFsaWRhdGlvbiBmYWlsc1xuICAgICAgICAgICAgICAgICAgY29uc3QgaXNWYWxpZCA9IChhd2FpdCB2YWxpZGF0b3IodmFsdWUpKSA9PT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZGVmaW5pdGlvbi50eXBlKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm1hdGlvbic6XG4gICAgICAgICAgICAgICAgcXVlc3Rpb24udHlwZSA9ICdjb25maXJtJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnbGlzdCc6XG4gICAgICAgICAgICAgICAgcXVlc3Rpb24udHlwZSA9IGRlZmluaXRpb24ubXVsdGlzZWxlY3QgPyAnY2hlY2tib3gnIDogJ2xpc3QnO1xuICAgICAgICAgICAgICAgIChxdWVzdGlvbiBhcyBDaGVja2JveFF1ZXN0aW9uKS5jaG9pY2VzID0gZGVmaW5pdGlvbi5pdGVtcz8ubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIGl0ZW0gPT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBpdGVtXG4gICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5sYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpdGVtLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcXVlc3Rpb24udHlwZSA9IGRlZmluaXRpb24udHlwZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHF1ZXN0aW9uO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChxdWVzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgeyBwcm9tcHQgfSA9IGF3YWl0IGltcG9ydCgnaW5xdWlyZXInKTtcblxuICAgICAgICAgIHJldHVybiBwcm9tcHQocXVlc3Rpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB3b3JrZmxvdztcbiAgfVxuXG4gIEBtZW1vaXplXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTY2hlbWF0aWNDb2xsZWN0aW9ucygpOiBQcm9taXNlPFNldDxzdHJpbmc+PiB7XG4gICAgLy8gUmVzb2x2ZSByZWxhdGl2ZSBjb2xsZWN0aW9ucyBmcm9tIHRoZSBsb2NhdGlvbiBvZiBgYW5ndWxhci5qc29uYFxuICAgIGNvbnN0IHJlc29sdmVSZWxhdGl2ZUNvbGxlY3Rpb24gPSAoY29sbGVjdGlvbk5hbWU6IHN0cmluZykgPT5cbiAgICAgIGNvbGxlY3Rpb25OYW1lLmNoYXJBdCgwKSA9PT0gJy4nXG4gICAgICAgID8gcmVzb2x2ZSh0aGlzLmNvbnRleHQucm9vdCwgY29sbGVjdGlvbk5hbWUpXG4gICAgICAgIDogY29sbGVjdGlvbk5hbWU7XG5cbiAgICBjb25zdCBnZXRTY2hlbWF0aWNDb2xsZWN0aW9ucyA9IChcbiAgICAgIGNvbmZpZ1NlY3Rpb246IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkLFxuICAgICk6IFNldDxzdHJpbmc+IHwgdW5kZWZpbmVkID0+IHtcbiAgICAgIGlmICghY29uZmlnU2VjdGlvbikge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7IHNjaGVtYXRpY0NvbGxlY3Rpb25zIH0gPSBjb25maWdTZWN0aW9uO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hdGljQ29sbGVjdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2V0KHNjaGVtYXRpY0NvbGxlY3Rpb25zLm1hcCgoYykgPT4gcmVzb2x2ZVJlbGF0aXZlQ29sbGVjdGlvbihjKSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBjb25zdCB7IHdvcmtzcGFjZSwgZ2xvYmFsQ29uZmlndXJhdGlvbiB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGlmICh3b3Jrc3BhY2UpIHtcbiAgICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0QnlDd2Qod29ya3NwYWNlKTtcbiAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0U2NoZW1hdGljQ29sbGVjdGlvbnMod29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9XG4gICAgICBnZXRTY2hlbWF0aWNDb2xsZWN0aW9ucyh3b3Jrc3BhY2U/LmdldENsaSgpKSA/P1xuICAgICAgZ2V0U2NoZW1hdGljQ29sbGVjdGlvbnMoZ2xvYmFsQ29uZmlndXJhdGlvbi5nZXRDbGkoKSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTZXQoW0RFRkFVTFRfU0NIRU1BVElDU19DT0xMRUNUSU9OXSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcGFyc2VTY2hlbWF0aWNJbmZvKFxuICAgIHNjaGVtYXRpYzogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICApOiBbY29sbGVjdGlvbk5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2NoZW1hdGljTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkXSB7XG4gICAgaWYgKHNjaGVtYXRpYz8uaW5jbHVkZXMoJzonKSkge1xuICAgICAgY29uc3QgW2NvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lXSA9IHNjaGVtYXRpYy5zcGxpdCgnOicsIDIpO1xuXG4gICAgICByZXR1cm4gW2NvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW3VuZGVmaW5lZCwgc2NoZW1hdGljXTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBydW5TY2hlbWF0aWMob3B0aW9uczoge1xuICAgIGV4ZWN1dGlvbk9wdGlvbnM6IFNjaGVtYXRpY3NFeGVjdXRpb25PcHRpb25zO1xuICAgIHNjaGVtYXRpY09wdGlvbnM6IE90aGVyT3B0aW9ucztcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nO1xuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZztcbiAgfSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB7IHNjaGVtYXRpY09wdGlvbnMsIGV4ZWN1dGlvbk9wdGlvbnMsIGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHdvcmtmbG93ID0gYXdhaXQgdGhpcy5nZXRPckNyZWF0ZVdvcmtmbG93Rm9yRXhlY3V0aW9uKGNvbGxlY3Rpb25OYW1lLCBleGVjdXRpb25PcHRpb25zKTtcblxuICAgIGlmICghc2NoZW1hdGljTmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzY2hlbWF0aWNOYW1lIGNhbm5vdCBiZSB1bmRlZmluZWQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgeyB1bnN1YnNjcmliZSwgZmlsZXMgfSA9IHN1YnNjcmliZVRvV29ya2Zsb3cod29ya2Zsb3csIGxvZ2dlcik7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgd29ya2Zsb3dcbiAgICAgICAgLmV4ZWN1dGUoe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAgIHNjaGVtYXRpYzogc2NoZW1hdGljTmFtZSxcbiAgICAgICAgICBvcHRpb25zOiBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgICAgIGxvZ2dlcixcbiAgICAgICAgICBhbGxvd1ByaXZhdGU6IHRoaXMuYWxsb3dQcml2YXRlU2NoZW1hdGljcyxcbiAgICAgICAgfSlcbiAgICAgICAgLnRvUHJvbWlzZSgpO1xuXG4gICAgICBpZiAoIWZpbGVzLnNpemUpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ05vdGhpbmcgdG8gYmUgZG9uZS4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4ZWN1dGlvbk9wdGlvbnMuZHJ5UnVuKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBcXG5OT1RFOiBUaGUgXCItLWRyeS1ydW5cIiBvcHRpb24gbWVhbnMgbm8gY2hhbmdlcyB3ZXJlIG1hZGUuYCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSB3b3JrZmxvdyB3YXMgbm90IHN1Y2Nlc3NmdWwsIHNob3cgYW4gYXBwcm9wcmlhdGUgZXJyb3IgbWVzc2FnZS5cbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbikge1xuICAgICAgICAvLyBcIlNlZSBhYm92ZVwiIGJlY2F1c2Ugd2UgYWxyZWFkeSBwcmludGVkIHRoZSBlcnJvci5cbiAgICAgICAgbG9nZ2VyLmZhdGFsKCdUaGUgU2NoZW1hdGljIHdvcmtmbG93IGZhaWxlZC4gU2VlIGFib3ZlLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXJ0SXNFcnJvcihlcnIpO1xuICAgICAgICBsb2dnZXIuZmF0YWwoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvamVjdE5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSwgbG9nZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgaWYgKCF3b3Jrc3BhY2UpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvamVjdE5hbWUgPSBnZXRQcm9qZWN0QnlDd2Qod29ya3NwYWNlKTtcbiAgICBpZiAocHJvamVjdE5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9qZWN0TmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRSZXNvbHZlUGF0aHMoY29sbGVjdGlvbk5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSwgcm9vdCB9ID0gdGhpcy5jb250ZXh0O1xuXG4gICAgcmV0dXJuIHdvcmtzcGFjZVxuICAgICAgPyAvLyBXb3Jrc3BhY2VcbiAgICAgICAgY29sbGVjdGlvbk5hbWUgPT09IERFRkFVTFRfU0NIRU1BVElDU19DT0xMRUNUSU9OXG4gICAgICAgID8gLy8gRmF2b3IgX19kaXJuYW1lIGZvciBAc2NoZW1hdGljcy9hbmd1bGFyIHRvIHVzZSB0aGUgYnVpbGQtaW4gdmVyc2lvblxuICAgICAgICAgIFtfX2Rpcm5hbWUsIHByb2Nlc3MuY3dkKCksIHJvb3RdXG4gICAgICAgIDogW3Byb2Nlc3MuY3dkKCksIHJvb3QsIF9fZGlybmFtZV1cbiAgICAgIDogLy8gR2xvYmFsXG4gICAgICAgIFtfX2Rpcm5hbWUsIHByb2Nlc3MuY3dkKCldO1xuICB9XG59XG4iXX0=