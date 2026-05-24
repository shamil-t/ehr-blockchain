import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {EhrContractService} from "../services/ehr-contract.service";

export const patientGuard: CanActivateChildFn = async (_route, _state) => {
  const ehrContractService = inject(EhrContractService);
  const router = inject(Router);
  const isPatient = await ehrContractService.isPatient();
  if (!isPatient) {
    await router.navigateByUrl('/register')
    return false
  }
  return true;
};
