"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonWorkspace = void 0;
const jsonc_parser_1 = require("jsonc-parser");
const utils_1 = require("../../json/utils");
const definitions_1 = require("../definitions");
const metadata_1 = require("./metadata");
const utilities_1 = require("./utilities");
const ANGULAR_WORKSPACE_EXTENSIONS = Object.freeze(['cli', 'newProjectRoot', 'schematics']);
const ANGULAR_PROJECT_EXTENSIONS = Object.freeze(['cli', 'schematics', 'projectType', 'i18n']);
async function readJsonWorkspace(path, host, options = {}) {
    const raw = await host.readFile(path);
    if (raw === undefined) {
        throw new Error('Unable to read workspace file.');
    }
    const ast = (0, jsonc_parser_1.parseTree)(raw, undefined, { allowTrailingComma: true, disallowComments: false });
    if (ast?.type !== 'object' || !ast.children) {
        throw new Error('Invalid workspace file - expected JSON object.');
    }
    // Version check
    const versionNode = (0, jsonc_parser_1.findNodeAtLocation)(ast, ['version']);
    if (!versionNode) {
        throw new Error('Unknown format - version specifier not found.');
    }
    const version = versionNode.value;
    if (version !== 1) {
        throw new Error(`Invalid format version detected - Expected:[ 1 ] Found: [ ${version} ]`);
    }
    const context = {
        host,
        metadata: new metadata_1.JsonWorkspaceMetadata(path, ast, raw),
        trackChanges: true,
        unprefixedWorkspaceExtensions: new Set([
            ...ANGULAR_WORKSPACE_EXTENSIONS,
            ...(options.allowedWorkspaceExtensions ?? []),
        ]),
        unprefixedProjectExtensions: new Set([
            ...ANGULAR_PROJECT_EXTENSIONS,
            ...(options.allowedProjectExtensions ?? []),
        ]),
        error(message, _node) {
            // TODO: Diagnostic reporting support
            throw new Error(message);
        },
        warn(message, _node) {
            // TODO: Diagnostic reporting support
            // eslint-disable-next-line no-console
            console.warn(message);
        },
    };
    const workspace = parseWorkspace(ast, context);
    return workspace;
}
exports.readJsonWorkspace = readJsonWorkspace;
function parseWorkspace(workspaceNode, context) {
    const jsonMetadata = context.metadata;
    let projects;
    let extensions;
    if (!context.trackChanges) {
        extensions = Object.create(null);
    }
    // TODO: `getNodeValue` - looks potentially expensive since it walks the whole tree and instantiates the full object structure each time.
    // Might be something to look at moving forward to optimize.
    const workspaceNodeValue = (0, jsonc_parser_1.getNodeValue)(workspaceNode);
    for (const [name, value] of Object.entries(workspaceNodeValue)) {
        if (name === '$schema' || name === 'version') {
            // skip
        }
        else if (name === 'projects') {
            const nodes = (0, jsonc_parser_1.findNodeAtLocation)(workspaceNode, ['projects']);
            if (!(0, utils_1.isJsonObject)(value) || !nodes) {
                context.error('Invalid "projects" field found; expected an object.', value);
                continue;
            }
            projects = parseProjectsObject(nodes, context);
        }
        else {
            if (!context.unprefixedWorkspaceExtensions.has(name) && !/^[a-z]{1,3}-.*/.test(name)) {
                context.warn(`Workspace extension with invalid name (${name}) found.`, name);
            }
            if (extensions) {
                extensions[name] = value;
            }
        }
    }
    let collectionListener;
    if (context.trackChanges) {
        collectionListener = (name, newValue) => {
            jsonMetadata.addChange(['projects', name], newValue, 'project');
        };
    }
    const projectCollection = new definitions_1.ProjectDefinitionCollection(projects, collectionListener);
    return {
        [metadata_1.JsonWorkspaceSymbol]: jsonMetadata,
        projects: projectCollection,
        // If not tracking changes the `extensions` variable will contain the parsed
        // values.  Otherwise the extensions are tracked via a virtual AST object.
        extensions: extensions ??
            (0, utilities_1.createVirtualAstObject)(workspaceNodeValue, {
                exclude: ['$schema', 'version', 'projects'],
                listener(path, value) {
                    jsonMetadata.addChange(path, value);
                },
            }),
    };
}
function parseProjectsObject(projectsNode, context) {
    const projects = Object.create(null);
    for (const [name, value] of Object.entries((0, jsonc_parser_1.getNodeValue)(projectsNode))) {
        const nodes = (0, jsonc_parser_1.findNodeAtLocation)(projectsNode, [name]);
        if (!(0, utils_1.isJsonObject)(value) || !nodes) {
            context.warn('Skipping invalid project value; expected an object.', value);
            continue;
        }
        projects[name] = parseProject(name, nodes, context);
    }
    return projects;
}
function parseProject(projectName, projectNode, context) {
    const jsonMetadata = context.metadata;
    let targets;
    let hasTargets = false;
    let extensions;
    let properties;
    if (!context.trackChanges) {
        // If not tracking changes, the parser will store the values directly in standard objects
        extensions = Object.create(null);
        properties = Object.create(null);
    }
    const projectNodeValue = (0, jsonc_parser_1.getNodeValue)(projectNode);
    if (!('root' in projectNodeValue)) {
        throw new Error(`Project "${projectName}" is missing a required property "root".`);
    }
    for (const [name, value] of Object.entries(projectNodeValue)) {
        switch (name) {
            case 'targets':
            case 'architect':
                const nodes = (0, jsonc_parser_1.findNodeAtLocation)(projectNode, [name]);
                if (!(0, utils_1.isJsonObject)(value) || !nodes) {
                    context.error(`Invalid "${name}" field found; expected an object.`, value);
                    break;
                }
                hasTargets = true;
                targets = parseTargetsObject(projectName, nodes, context);
                jsonMetadata.hasLegacyTargetsName = name === 'architect';
                break;
            case 'prefix':
            case 'root':
            case 'sourceRoot':
                if (typeof value !== 'string') {
                    context.warn(`Project property "${name}" should be a string.`, value);
                }
                if (properties) {
                    properties[name] = value;
                }
                break;
            default:
                if (!context.unprefixedProjectExtensions.has(name) && !/^[a-z]{1,3}-.*/.test(name)) {
                    context.warn(`Project '${projectName}' contains extension with invalid name (${name}).`, name);
                }
                if (extensions) {
                    extensions[name] = value;
                }
                break;
        }
    }
    let collectionListener;
    if (context.trackChanges) {
        collectionListener = (name, newValue, collection) => {
            if (hasTargets) {
                jsonMetadata.addChange(['projects', projectName, 'targets', name], newValue, 'target');
            }
            else {
                jsonMetadata.addChange(['projects', projectName, 'targets'], collection, 'targetcollection');
            }
        };
    }
    const base = {
        targets: new definitions_1.TargetDefinitionCollection(targets, collectionListener),
        // If not tracking changes the `extensions` variable will contain the parsed
        // values.  Otherwise the extensions are tracked via a virtual AST object.
        extensions: extensions ??
            (0, utilities_1.createVirtualAstObject)(projectNodeValue, {
                exclude: ['architect', 'prefix', 'root', 'sourceRoot', 'targets'],
                listener(path, value) {
                    jsonMetadata.addChange(['projects', projectName, ...path], value);
                },
            }),
    };
    const baseKeys = new Set(Object.keys(base));
    const project = properties ??
        (0, utilities_1.createVirtualAstObject)(projectNodeValue, {
            include: ['prefix', 'root', 'sourceRoot', ...baseKeys],
            listener(path, value) {
                if (!baseKeys.has(path[0])) {
                    jsonMetadata.addChange(['projects', projectName, ...path], value);
                }
            },
        });
    return Object.assign(project, base);
}
function parseTargetsObject(projectName, targetsNode, context) {
    const jsonMetadata = context.metadata;
    const targets = Object.create(null);
    for (const [name, value] of Object.entries((0, jsonc_parser_1.getNodeValue)(targetsNode))) {
        if (!(0, utils_1.isJsonObject)(value)) {
            context.warn('Skipping invalid target value; expected an object.', value);
            continue;
        }
        if (context.trackChanges) {
            targets[name] = (0, utilities_1.createVirtualAstObject)(value, {
                include: ['builder', 'options', 'configurations', 'defaultConfiguration'],
                listener(path, value) {
                    jsonMetadata.addChange(['projects', projectName, 'targets', name, ...path], value);
                },
            });
        }
        else {
            targets[name] = value;
        }
    }
    return targets;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvd29ya3NwYWNlL2pzb24vcmVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFpRjtBQUNqRiw0Q0FBMkQ7QUFDM0QsZ0RBT3dCO0FBRXhCLHlDQUF3RTtBQUN4RSwyQ0FBcUQ7QUFFckQsTUFBTSw0QkFBNEIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFDNUYsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQWlCeEYsS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxJQUFZLEVBQ1osSUFBbUIsRUFDbkIsVUFBZ0MsRUFBRTtJQUVsQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO1FBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztLQUNuRDtJQUVELE1BQU0sR0FBRyxHQUFHLElBQUEsd0JBQVMsRUFBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDN0YsSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLFFBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7UUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0tBQ25FO0lBRUQsZ0JBQWdCO0lBQ2hCLE1BQU0sV0FB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Q0FBQztnQkFDekUsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLO29CQUNsQixZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7YUFDRixDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQW9DLENBQUM7U0FDdEQ7S0FDRjtJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgTm9kZSwgZmluZE5vZGVBdExvY2F0aW9uLCBnZXROb2RlVmFsdWUsIHBhcnNlVHJlZSB9IGZyb20gJ2pzb25jLXBhcnNlcic7XG5pbXBvcnQgeyBKc29uVmFsdWUsIGlzSnNvbk9iamVjdCB9IGZyb20gJy4uLy4uL2pzb24vdXRpbHMnO1xuaW1wb3J0IHtcbiAgRGVmaW5pdGlvbkNvbGxlY3Rpb25MaXN0ZW5lcixcbiAgUHJvamVjdERlZmluaXRpb24sXG4gIFByb2plY3REZWZpbml0aW9uQ29sbGVjdGlvbixcbiAgVGFyZ2V0RGVmaW5pdGlvbixcbiAgVGFyZ2V0RGVmaW5pdGlvbkNvbGxlY3Rpb24sXG4gIFdvcmtzcGFjZURlZmluaXRpb24sXG59IGZyb20gJy4uL2RlZmluaXRpb25zJztcbmltcG9ydCB7IFdvcmtzcGFjZUhvc3QgfSBmcm9tICcuLi9ob3N0JztcbmltcG9ydCB7IEpzb25Xb3Jrc3BhY2VNZXRhZGF0YSwgSnNvbldvcmtzcGFjZVN5bWJvbCB9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHsgY3JlYXRlVmlydHVhbEFzdE9iamVjdCB9IGZyb20gJy4vdXRpbGl0aWVzJztcblxuY29uc3QgQU5HVUxBUl9XT1JLU1BBQ0VfRVhURU5TSU9OUyA9IE9iamVjdC5mcmVlemUoWydjbGknLCAnbmV3UHJvamVjdFJvb3QnLCAnc2NoZW1hdGljcyddKTtcbmNvbnN0IEFOR1VMQVJfUFJPSkVDVF9FWFRFTlNJT05TID0gT2JqZWN0LmZyZWV6ZShbJ2NsaScsICdzY2hlbWF0aWNzJywgJ3Byb2plY3RUeXBlJywgJ2kxOG4nXSk7XG5cbmludGVyZmFjZSBQYXJzZXJDb250ZXh0IHtcbiAgcmVhZG9ubHkgaG9zdDogV29ya3NwYWNlSG9zdDtcbiAgcmVhZG9ubHkgbWV0YWRhdGE6IEpzb25Xb3Jrc3BhY2VNZXRhZGF0YTtcbiAgcmVhZG9ubHkgdHJhY2tDaGFuZ2VzOiBib29sZWFuO1xuICByZWFkb25seSB1bnByZWZpeGVkV29ya3NwYWNlRXh0ZW5zaW9uczogUmVhZG9ubHlTZXQ8c3RyaW5nPjtcbiAgcmVhZG9ubHkgdW5wcmVmaXhlZFByb2plY3RFeHRlbnNpb25zOiBSZWFkb25seVNldDxzdHJpbmc+O1xuICBlcnJvcihtZXNzYWdlOiBzdHJpbmcsIG5vZGU6IEpzb25WYWx1ZSk6IHZvaWQ7XG4gIHdhcm4obWVzc2FnZTogc3RyaW5nLCBub2RlOiBKc29uVmFsdWUpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEpzb25Xb3Jrc3BhY2VPcHRpb25zIHtcbiAgYWxsb3dlZFByb2plY3RFeHRlbnNpb25zPzogc3RyaW5nW107XG4gIGFsbG93ZWRXb3Jrc3BhY2VFeHRlbnNpb25zPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkSnNvbldvcmtzcGFjZShcbiAgcGF0aDogc3RyaW5nLFxuICBob3N0OiBXb3Jrc3BhY2VIb3N0LFxuICBvcHRpb25zOiBKc29uV29ya3NwYWNlT3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxXb3Jrc3BhY2VEZWZpbml0aW9uPiB7XG4gIGNvbnN0IHJhdyA9IGF3YWl0IGhvc3QucmVhZEZpbGUocGF0aCk7XG4gIGlmIChyYXcgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHJlYWQgd29ya3NwYWNlIGZpbGUuJyk7XG4gIH1cblxuICBjb25zdCBhc3QgPSBwYXJzZVRyZWUocmF3LCB1bmRlZmluZWQsIHsgYWxsb3dUcmFpbGluZ0NvbW1hOiB0cnVlLCBkaXNhbGxvd0NvbW1lbnRzOiBmYWxzZSB9KTtcbiAgaWYgKGFzdD8udHlwZSAhPT0gJ29iamVjdCcgfHwgIWFzdC5jaGlsZHJlbikge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB3b3Jrc3BhY2UgZmlsZSAtIGV4cGVjdGVkIEpTT04gb2JqZWN0LicpO1xuICB9XG5cbiAgLy8gVmVyc2lvbiBjaGVja1xuICBjb25zdCB2ZXJzaW9uTm9kZSA9IGZpbmROb2RlQXRMb2NhdGlvbihhc3QsIFsndmVyc2lvbiddKTtcbiAgaWYgKCF2ZXJzaW9uTm9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBmb3JtYXQgLSB2ZXJzaW9uIHNwZWNpZmllciBub3QgZm91bmQuJyk7XG4gIH1cbiAgY29uc3QgdmVyc2lvbiA9IHZlcnNpb25Ob2RlLnZhbHVlO1xuICBpZiAodmVyc2lvbiAhPT0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmb3JtYXQgdmVyc2lvbiBkZXRlY3RlZCAtIEV4cGVjdGVkOlsgMSBdIEZvdW5kOiBbICR7dmVyc2lvbn0gXWApO1xuICB9XG5cbiAgY29uc3QgY29udGV4dDogUGFyc2VyQ29udGV4dCA9IHtcbiAgICBob3N0LFxuICAgIG1ldGFkYXRhOiBuZXcgSnNvbldvcmtzcGFjZU1ldGFkYXRhKHBhdGgsIGFzdCwgcmF3KSxcbiAgICB0cmFja0NoYW5nZXM6IHRydWUsXG4gICAgdW5wcmVmaXhlZFdvcmtzcGFjZUV4dGVuc2lvbnM6IG5ldyBTZXQoW1xuICAgICAgLi4uQU5HVUxBUl9XT1JLU1BBQ0VfRVhURU5TSU9OUyxcbiAgICAgIC4uLihvcHRpb25zLmFsbG93ZWRXb3Jrc3BhY2VFeHRlbnNpb25zID8/IFtdKSxcbiAgICBdKSxcbiAgICB1bnByZWZpeGVkUHJvamVjdEV4dGVuc2lvbnM6IG5ldyBTZXQoW1xuICAgICAgLi4uQU5HVUxBUl9QUk9KRUNUX0VYVEVOU0lPTlMsXG4gICAgICAuLi4ob3B0aW9ucy5hbGxvd2VkUHJvamVjdEV4dGVuc2lvbnMgPz8gW10pLFxuICAgIF0pLFxuICAgIGVycm9yKG1lc3NhZ2UsIF9ub2RlKSB7XG4gICAgICAvLyBUT0RPOiBEaWFnbm9zdGljIHJlcG9ydGluZyBzdXBwb3J0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSxcbiAgICB3YXJuKG1lc3NhZ2UsIF9ub2RlKSB7XG4gICAgICAvLyBUT0RPOiBEaWFnbm9zdGljIHJlcG9ydGluZyBzdXBwb3J0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgIH0sXG4gIH07XG5cbiAgY29uc3Qgd29ya3NwYWNlID0gcGFyc2VXb3Jrc3BhY2UoYXN0LCBjb250ZXh0KTtcblxuICByZXR1cm4gd29ya3NwYWNlO1xufVxuXG5mdW5jdGlvbiBwYXJzZVdvcmtzcGFjZSh3b3Jrc3BhY2VOb2RlOiBOb2RlLCBjb250ZXh0OiBQYXJzZXJDb250ZXh0KTogV29ya3NwYWNlRGVmaW5pdGlvbiB7XG4gIGNvbnN0IGpzb25NZXRhZGF0YSA9IGNvbnRleHQubWV0YWRhdGE7XG4gIGxldCBwcm9qZWN0cztcbiAgbGV0IGV4dGVuc2lvbnM6IFJlY29yZDxzdHJpbmcsIEpzb25WYWx1ZT4gfCB1bmRlZmluZWQ7XG4gIGlmICghY29udGV4dC50cmFja0NoYW5nZXMpIHtcbiAgICBleHRlbnNpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIC8vIFRPRE86IGBnZXROb2RlVmFsdWVgIC0gbG9va3MgcG90ZW50aWFsbHkgZXhwZW5zaXZlIHNpbmNlIGl0IHdhbGtzIHRoZSB3aG9sZSB0cmVlIGFuZCBpbnN0YW50aWF0ZXMgdGhlIGZ1bGwgb2JqZWN0IHN0cnVjdHVyZSBlYWNoIHRpbWUuXG4gIC8vIE1pZ2h0IGJlIHNvbWV0aGluZyB0byBsb29rIGF0IG1vdmluZyBmb3J3YXJkIHRvIG9wdGltaXplLlxuICBjb25zdCB3b3Jrc3BhY2VOb2RlVmFsdWUgPSBnZXROb2RlVmFsdWUod29ya3NwYWNlTm9kZSk7XG4gIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllczxKc29uVmFsdWU+KHdvcmtzcGFjZU5vZGVWYWx1ZSkpIHtcbiAgICBpZiAobmFtZSA9PT0gJyRzY2hlbWEnIHx8IG5hbWUgPT09ICd2ZXJzaW9uJykge1xuICAgICAgLy8gc2tpcFxuICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ3Byb2plY3RzJykge1xuICAgICAgY29uc3Qgbm9kZXMgPSBmaW5kTm9kZUF0TG9jYXRpb24od29ya3NwYWNlTm9kZSwgWydwcm9qZWN0cyddKTtcbiAgICAgIGlmICghaXNKc29uT2JqZWN0KHZhbHVlKSB8fCAhbm9kZXMpIHtcbiAgICAgICAgY29udGV4dC5lcnJvcignSW52YWxpZCBcInByb2plY3RzXCIgZmllbGQgZm91bmQ7IGV4cGVjdGVkIGFuIG9iamVjdC4nLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9qZWN0cyA9IHBhcnNlUHJvamVjdHNPYmplY3Qobm9kZXMsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWNvbnRleHQudW5wcmVmaXhlZFdvcmtzcGFjZUV4dGVuc2lvbnMuaGFzKG5hbWUpICYmICEvXlthLXpdezEsM30tLiovLnRlc3QobmFtZSkpIHtcbiAgICAgICAgY29udGV4dC53YXJuKGBXb3Jrc3BhY2UgZXh0ZW5zaW9uIHdpdGggaW52YWxpZCBuYW1lICgke25hbWV9KSBmb3VuZC5gLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChleHRlbnNpb25zKSB7XG4gICAgICAgIGV4dGVuc2lvbnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgY29sbGVjdGlvbkxpc3RlbmVyOiBEZWZpbml0aW9uQ29sbGVjdGlvbkxpc3RlbmVyPFByb2plY3REZWZpbml0aW9uPiB8IHVuZGVmaW5lZDtcbiAgaWYgKGNvbnRleHQudHJhY2tDaGFuZ2VzKSB7XG4gICAgY29sbGVjdGlvbkxpc3RlbmVyID0gKG5hbWUsIG5ld1ZhbHVlKSA9PiB7XG4gICAgICBqc29uTWV0YWRhdGEuYWRkQ2hhbmdlKFsncHJvamVjdHMnLCBuYW1lXSwgbmV3VmFsdWUsICdwcm9qZWN0Jyk7XG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHByb2plY3RDb2xsZWN0aW9uID0gbmV3IFByb2plY3REZWZpbml0aW9uQ29sbGVjdGlvbihwcm9qZWN0cywgY29sbGVjdGlvbkxpc3RlbmVyKTtcblxuICByZXR1cm4ge1xuICAgIFtKc29uV29ya3NwYWNlU3ltYm9sXToganNvbk1ldGFkYXRhLFxuICAgIHByb2plY3RzOiBwcm9qZWN0Q29sbGVjdGlvbixcbiAgICAvLyBJZiBub3QgdHJhY2tpbmcgY2hhbmdlcyB0aGUgYGV4dGVuc2lvbnNgIHZhcmlhYmxlIHdpbGwgY29udGFpbiB0aGUgcGFyc2VkXG4gICAgLy8gdmFsdWVzLiAgT3RoZXJ3aXNlIHRoZSBleHRlbnNpb25zIGFyZSB0cmFja2VkIHZpYSBhIHZpcnR1YWwgQVNUIG9iamVjdC5cbiAgICBleHRlbnNpb25zOlxuICAgICAgZXh0ZW5zaW9ucyA/P1xuICAgICAgY3JlYXRlVmlydHVhbEFzdE9iamVjdCh3b3Jrc3BhY2VOb2RlVmFsdWUsIHtcbiAgICAgICAgZXhjbHVkZTogWyckc2NoZW1hJywgJ3ZlcnNpb24nLCAncHJvamVjdHMnXSxcbiAgICAgICAgbGlzdGVuZXIocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICBqc29uTWV0YWRhdGEuYWRkQ2hhbmdlKHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICB9IGFzIFdvcmtzcGFjZURlZmluaXRpb247XG59XG5cbmZ1bmN0aW9uIHBhcnNlUHJvamVjdHNPYmplY3QoXG4gIHByb2plY3RzTm9kZTogTm9kZSxcbiAgY29udGV4dDogUGFyc2VyQ29udGV4dCxcbik6IFJlY29yZDxzdHJpbmcsIFByb2plY3REZWZpbml0aW9uPiB7XG4gIGNvbnN0IHByb2plY3RzOiBSZWNvcmQ8c3RyaW5nLCBQcm9qZWN0RGVmaW5pdGlvbj4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllczxKc29uVmFsdWU+KGdldE5vZGVWYWx1ZShwcm9qZWN0c05vZGUpKSkge1xuICAgIGNvbnN0IG5vZGVzID0gZmluZE5vZGVBdExvY2F0aW9uKHByb2plY3RzTm9kZSwgW25hbWVdKTtcbiAgICBpZiAoIWlzSnNvbk9iamVjdCh2YWx1ZSkgfHwgIW5vZGVzKSB7XG4gICAgICBjb250ZXh0Lndhcm4oJ1NraXBwaW5nIGludmFsaWQgcHJvamVjdCB2YWx1ZTsgZXhwZWN0ZWQgYW4gb2JqZWN0LicsIHZhbHVlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHByb2plY3RzW25hbWVdID0gcGFyc2VQcm9qZWN0KG5hbWUsIG5vZGVzLCBjb250ZXh0KTtcbiAgfVxuXG4gIHJldHVybiBwcm9qZWN0cztcbn1cblxuZnVuY3Rpb24gcGFyc2VQcm9qZWN0KFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBwcm9qZWN0Tm9kZTogTm9kZSxcbiAgY29udGV4dDogUGFyc2VyQ29udGV4dCxcbik6IFByb2plY3REZWZpbml0aW9uIHtcbiAgY29uc3QganNvbk1ldGFkYXRhID0gY29udGV4dC5tZXRhZGF0YTtcbiAgbGV0IHRhcmdldHM7XG4gIGxldCBoYXNUYXJnZXRzID0gZmFsc2U7XG4gIGxldCBleHRlbnNpb25zOiBSZWNvcmQ8c3RyaW5nLCBKc29uVmFsdWU+IHwgdW5kZWZpbmVkO1xuICBsZXQgcHJvcGVydGllczogUmVjb3JkPCdyb290JyB8ICdzb3VyY2VSb290JyB8ICdwcmVmaXgnLCBzdHJpbmc+IHwgdW5kZWZpbmVkO1xuICBpZiAoIWNvbnRleHQudHJhY2tDaGFuZ2VzKSB7XG4gICAgLy8gSWYgbm90IHRyYWNraW5nIGNoYW5nZXMsIHRoZSBwYXJzZXIgd2lsbCBzdG9yZSB0aGUgdmFsdWVzIGRpcmVjdGx5IGluIHN0YW5kYXJkIG9iamVjdHNcbiAgICBleHRlbnNpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBwcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIGNvbnN0IHByb2plY3ROb2RlVmFsdWUgPSBnZXROb2RlVmFsdWUocHJvamVjdE5vZGUpO1xuICBpZiAoISgncm9vdCcgaW4gcHJvamVjdE5vZGVWYWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFByb2plY3QgXCIke3Byb2plY3ROYW1lfVwiIGlzIG1pc3NpbmcgYSByZXF1aXJlZCBwcm9wZXJ0eSBcInJvb3RcIi5gKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllczxKc29uVmFsdWU+KHByb2plY3ROb2RlVmFsdWUpKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICd0YXJnZXRzJzpcbiAgICAgIGNhc2UgJ2FyY2hpdGVjdCc6XG4gICAgICAgIGNvbnN0IG5vZGVzID0gZmluZE5vZGVBdExvY2F0aW9uKHByb2plY3ROb2RlLCBbbmFtZV0pO1xuICAgICAgICBpZiAoIWlzSnNvbk9iamVjdCh2YWx1ZSkgfHwgIW5vZGVzKSB7XG4gICAgICAgICAgY29udGV4dC5lcnJvcihgSW52YWxpZCBcIiR7bmFtZX1cIiBmaWVsZCBmb3VuZDsgZXhwZWN0ZWQgYW4gb2JqZWN0LmAsIHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBoYXNUYXJnZXRzID0gdHJ1ZTtcbiAgICAgICAgdGFyZ2V0cyA9IHBhcnNlVGFyZ2V0c09iamVjdChwcm9qZWN0TmFtZSwgbm9kZXMsIGNvbnRleHQpO1xuICAgICAgICBqc29uTWV0YWRhdGEuaGFzTGVnYWN5VGFyZ2V0c05hbWUgPSBuYW1lID09PSAnYXJjaGl0ZWN0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwcmVmaXgnOlxuICAgICAgY2FzZSAncm9vdCc6XG4gICAgICBjYXNlICdzb3VyY2VSb290JzpcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb250ZXh0Lndhcm4oYFByb2plY3QgcHJvcGVydHkgXCIke25hbWV9XCIgc2hvdWxkIGJlIGEgc3RyaW5nLmAsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgIHByb3BlcnRpZXNbbmFtZV0gPSB2YWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAoIWNvbnRleHQudW5wcmVmaXhlZFByb2plY3RFeHRlbnNpb25zLmhhcyhuYW1lKSAmJiAhL15bYS16XXsxLDN9LS4qLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgY29udGV4dC53YXJuKFxuICAgICAgICAgICAgYFByb2plY3QgJyR7cHJvamVjdE5hbWV9JyBjb250YWlucyBleHRlbnNpb24gd2l0aCBpbnZhbGlkIG5hbWUgKCR7bmFtZX0pLmAsXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4dGVuc2lvbnMpIHtcbiAgICAgICAgICBleHRlbnNpb25zW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgbGV0IGNvbGxlY3Rpb25MaXN0ZW5lcjogRGVmaW5pdGlvbkNvbGxlY3Rpb25MaXN0ZW5lcjxUYXJnZXREZWZpbml0aW9uPiB8IHVuZGVmaW5lZDtcbiAgaWYgKGNvbnRleHQudHJhY2tDaGFuZ2VzKSB7XG4gICAgY29sbGVjdGlvbkxpc3RlbmVyID0gKG5hbWUsIG5ld1ZhbHVlLCBjb2xsZWN0aW9uKSA9PiB7XG4gICAgICBpZiAoaGFzVGFyZ2V0cykge1xuICAgICAgICBqc29uTWV0YWRhdGEuYWRkQ2hhbmdlKFsncHJvamVjdHMnLCBwcm9qZWN0TmFtZSwgJ3RhcmdldHMnLCBuYW1lXSwgbmV3VmFsdWUsICd0YXJnZXQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGpzb25NZXRhZGF0YS5hZGRDaGFuZ2UoXG4gICAgICAgICAgWydwcm9qZWN0cycsIHByb2plY3ROYW1lLCAndGFyZ2V0cyddLFxuICAgICAgICAgIGNvbGxlY3Rpb24sXG4gICAgICAgICAgJ3RhcmdldGNvbGxlY3Rpb24nLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBjb25zdCBiYXNlID0ge1xuICAgIHRhcmdldHM6IG5ldyBUYXJnZXREZWZpbml0aW9uQ29sbGVjdGlvbih0YXJnZXRzLCBjb2xsZWN0aW9uTGlzdGVuZXIpLFxuICAgIC8vIElmIG5vdCB0cmFja2luZyBjaGFuZ2VzIHRoZSBgZXh0ZW5zaW9uc2AgdmFyaWFibGUgd2lsbCBjb250YWluIHRoZSBwYXJzZWRcbiAgICAvLyB2YWx1ZXMuICBPdGhlcndpc2UgdGhlIGV4dGVuc2lvbnMgYXJlIHRyYWNrZWQgdmlhIGEgdmlydHVhbCBBU1Qgb2JqZWN0LlxuICAgIGV4dGVuc2lvbnM6XG4gICAgICBleHRlbnNpb25zID8/XG4gICAgICBjcmVhdGVWaXJ0dWFsQXN0T2JqZWN0KHByb2plY3ROb2RlVmFsdWUsIHtcbiAgICAgICAgZXhjbHVkZTogWydhcmNoaXRlY3QnLCAncHJlZml4JywgJ3Jvb3QnLCAnc291cmNlUm9vdCcsICd0YXJnZXRzJ10sXG4gICAgICAgIGxpc3RlbmVyKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAganNvbk1ldGFkYXRhLmFkZENoYW5nZShbJ3Byb2plY3RzJywgcHJvamVjdE5hbWUsIC4uLnBhdGhdLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgfTtcblxuICBjb25zdCBiYXNlS2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMoYmFzZSkpO1xuICBjb25zdCBwcm9qZWN0ID1cbiAgICBwcm9wZXJ0aWVzID8/XG4gICAgY3JlYXRlVmlydHVhbEFzdE9iamVjdDxQcm9qZWN0RGVmaW5pdGlvbj4ocHJvamVjdE5vZGVWYWx1ZSwge1xuICAgICAgaW5jbHVkZTogWydwcmVmaXgnLCAncm9vdCcsICdzb3VyY2VSb290JywgLi4uYmFzZUtleXNdLFxuICAgICAgbGlzdGVuZXIocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFiYXNlS2V5cy5oYXMocGF0aFswXSkpIHtcbiAgICAgICAgICBqc29uTWV0YWRhdGEuYWRkQ2hhbmdlKFsncHJvamVjdHMnLCBwcm9qZWN0TmFtZSwgLi4ucGF0aF0sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihwcm9qZWN0LCBiYXNlKSBhcyBQcm9qZWN0RGVmaW5pdGlvbjtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYXJnZXRzT2JqZWN0KFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICB0YXJnZXRzTm9kZTogTm9kZSxcbiAgY29udGV4dDogUGFyc2VyQ29udGV4dCxcbik6IFJlY29yZDxzdHJpbmcsIFRhcmdldERlZmluaXRpb24+IHtcbiAgY29uc3QganNvbk1ldGFkYXRhID0gY29udGV4dC5tZXRhZGF0YTtcbiAgY29uc3QgdGFyZ2V0czogUmVjb3JkPHN0cmluZywgVGFyZ2V0RGVmaW5pdGlvbj4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllczxKc29uVmFsdWU+KGdldE5vZGVWYWx1ZSh0YXJnZXRzTm9kZSkpKSB7XG4gICAgaWYgKCFpc0pzb25PYmplY3QodmFsdWUpKSB7XG4gICAgICBjb250ZXh0Lndhcm4oJ1NraXBwaW5nIGludmFsaWQgdGFyZ2V0IHZhbHVlOyBleHBlY3RlZCBhbiBvYmplY3QuJywgdmFsdWUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQudHJhY2tDaGFuZ2VzKSB7XG4gICAgICB0YXJnZXRzW25hbWVdID0gY3JlYXRlVmlydHVhbEFzdE9iamVjdDxUYXJnZXREZWZpbml0aW9uPih2YWx1ZSwge1xuICAgICAgICBpbmNsdWRlOiBbJ2J1aWxkZXInLCAnb3B0aW9ucycsICdjb25maWd1cmF0aW9ucycsICdkZWZhdWx0Q29uZmlndXJhdGlvbiddLFxuICAgICAgICBsaXN0ZW5lcihwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgIGpzb25NZXRhZGF0YS5hZGRDaGFuZ2UoWydwcm9qZWN0cycsIHByb2plY3ROYW1lLCAndGFyZ2V0cycsIG5hbWUsIC4uLnBhdGhdLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0c1tuYW1lXSA9IHZhbHVlIGFzIHVua25vd24gYXMgVGFyZ2V0RGVmaW5pdGlvbjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0cztcbn1cbiJdfQ==