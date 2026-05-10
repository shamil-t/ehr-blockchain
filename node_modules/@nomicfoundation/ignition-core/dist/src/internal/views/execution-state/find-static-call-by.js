import { NetworkInteractionType } from "../../execution/types/network-interaction.js";
import { assertIgnitionInvariant } from "../../utils/assertions.js";
export function findStaticCallBy(executionState, networkInteractionId) {
    const staticCall = executionState.networkInteractions.find((interaction) => interaction.id === networkInteractionId);
    assertIgnitionInvariant(staticCall !== undefined, `Expected static call ${executionState.id}/${networkInteractionId} to exist, but it did not`);
    assertIgnitionInvariant(staticCall.type === NetworkInteractionType.STATIC_CALL, `Expected network interaction ${executionState.id}/${networkInteractionId} to be a static call, but instead it was ${staticCall.type}`);
    return staticCall;
}
//# sourceMappingURL=find-static-call-by.js.map