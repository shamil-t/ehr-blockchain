import { FutureType, RuntimeValueType } from "../types/module.js";
const CUSTOM_INSPECT_SYMBOL = Symbol.for("nodejs.util.inspect.custom");
class BaseFutureImplementation {
    id;
    type;
    module;
    dependencies = new Set();
    constructor(id, type, module) {
        this.id = id;
        this.type = type;
        this.module = module;
        Object.defineProperty(this, CUSTOM_INSPECT_SYMBOL, {
            value: (_depth, { inspect }) => {
                const padding = " ".repeat(2);
                return `Future ${this.id} {
        Type: ${FutureType[this.type]}
        Module: ${this.module.id}
        Dependencies: ${inspect(Array.from(this.dependencies).map((f) => f.id)).replace(/\n/g, `\n${padding}`)}
      }`;
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}
export class NamedContractDeploymentFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    constructorArgs;
    libraries;
    value;
    from;
    constructor(id, module, contractName, constructorArgs, libraries, value, from) {
        super(id, FutureType.NAMED_ARTIFACT_CONTRACT_DEPLOYMENT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.constructorArgs = constructorArgs;
        this.libraries = libraries;
        this.value = value;
        this.from = from;
    }
}
export class ArtifactContractDeploymentFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    constructorArgs;
    artifact;
    libraries;
    value;
    from;
    constructor(id, module, contractName, constructorArgs, artifact, libraries, value, from) {
        super(id, FutureType.CONTRACT_DEPLOYMENT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.constructorArgs = constructorArgs;
        this.artifact = artifact;
        this.libraries = libraries;
        this.value = value;
        this.from = from;
    }
}
export class NamedLibraryDeploymentFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    libraries;
    from;
    constructor(id, module, contractName, libraries, from) {
        super(id, FutureType.NAMED_ARTIFACT_LIBRARY_DEPLOYMENT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.libraries = libraries;
        this.from = from;
    }
}
export class ArtifactLibraryDeploymentFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    artifact;
    libraries;
    from;
    constructor(id, module, contractName, artifact, libraries, from) {
        super(id, FutureType.LIBRARY_DEPLOYMENT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.artifact = artifact;
        this.libraries = libraries;
        this.from = from;
    }
}
export class NamedContractCallFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    functionName;
    contract;
    args;
    value;
    from;
    constructor(id, module, functionName, contract, args, value, from) {
        super(id, FutureType.CONTRACT_CALL, module);
        this.id = id;
        this.module = module;
        this.functionName = functionName;
        this.contract = contract;
        this.args = args;
        this.value = value;
        this.from = from;
    }
}
export class NamedStaticCallFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    functionName;
    contract;
    args;
    nameOrIndex;
    from;
    constructor(id, module, functionName, contract, args, nameOrIndex, from) {
        super(id, FutureType.STATIC_CALL, module);
        this.id = id;
        this.module = module;
        this.functionName = functionName;
        this.contract = contract;
        this.args = args;
        this.nameOrIndex = nameOrIndex;
        this.from = from;
    }
}
export class NamedEncodeFunctionCallFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    functionName;
    contract;
    args;
    constructor(id, module, functionName, contract, args) {
        super(id, FutureType.ENCODE_FUNCTION_CALL, module);
        this.id = id;
        this.module = module;
        this.functionName = functionName;
        this.contract = contract;
        this.args = args;
    }
}
export class NamedContractAtFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    address;
    constructor(id, module, contractName, address) {
        super(id, FutureType.NAMED_ARTIFACT_CONTRACT_AT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.address = address;
    }
}
export class ArtifactContractAtFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    contractName;
    address;
    artifact;
    constructor(id, module, contractName, address, artifact) {
        super(id, FutureType.CONTRACT_AT, module);
        this.id = id;
        this.module = module;
        this.contractName = contractName;
        this.address = address;
        this.artifact = artifact;
    }
}
export class ReadEventArgumentFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    futureToReadFrom;
    eventName;
    nameOrIndex;
    emitter;
    eventIndex;
    constructor(id, module, futureToReadFrom, eventName, nameOrIndex, emitter, eventIndex) {
        super(id, FutureType.READ_EVENT_ARGUMENT, module);
        this.id = id;
        this.module = module;
        this.futureToReadFrom = futureToReadFrom;
        this.eventName = eventName;
        this.nameOrIndex = nameOrIndex;
        this.emitter = emitter;
        this.eventIndex = eventIndex;
    }
}
export class SendDataFutureImplementation extends BaseFutureImplementation {
    id;
    module;
    to;
    value;
    data;
    from;
    constructor(id, module, to, value, data, from) {
        super(id, FutureType.SEND_DATA, module);
        this.id = id;
        this.module = module;
        this.to = to;
        this.value = value;
        this.data = data;
        this.from = from;
    }
}
export class IgnitionModuleImplementation {
    id;
    results;
    futures = new Set();
    submodules = new Set();
    constructor(id, results) {
        this.id = id;
        this.results = results;
        Object.defineProperty(this, CUSTOM_INSPECT_SYMBOL, {
            value: (_depth, { inspect }) => {
                const padding = " ".repeat(2);
                return `IgnitionModule ${this.id} {
        Futures: ${inspect(this.futures).replace(/\n/g, `\n${padding}`)}
        Results: ${inspect(this.results).replace(/\n/g, `\n${padding}`)}
        Submodules: ${inspect(Array.from(this.submodules).map((m) => m.id)).replace(/\n/g, `\n${padding}`)}
      }`;
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}
export class AccountRuntimeValueImplementation {
    accountIndex;
    type = RuntimeValueType.ACCOUNT;
    constructor(accountIndex) {
        this.accountIndex = accountIndex;
        Object.defineProperty(this, CUSTOM_INSPECT_SYMBOL, {
            value: (_depth, _inspectOptions) => {
                return `Account RuntimeValue {
          accountIndex: ${this.accountIndex}
      }`;
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}
export class ModuleParameterRuntimeValueImplementation {
    moduleId;
    name;
    defaultValue;
    type = RuntimeValueType.MODULE_PARAMETER;
    constructor(moduleId, name, defaultValue) {
        this.moduleId = moduleId;
        this.name = name;
        this.defaultValue = defaultValue;
        Object.defineProperty(this, CUSTOM_INSPECT_SYMBOL, {
            value: (_depth, { inspect }) => {
                return `Module Parameter RuntimeValue {
          name: ${this.name}${this.defaultValue !== undefined
                    ? `
          default value: ${inspect(this.defaultValue)}`
                    : ""}
      }`;
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}
//# sourceMappingURL=module.js.map