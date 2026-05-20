import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {EhrContractService} from "../services/ehr-contract.service";

export const doctorGuard: CanActivateChildFn = async (_route, _state) => {
  const ehrContractService = inject(EhrContractService);
  const router = inject(Router);
  // console.log("Validating Doctor Guard");
  const isDoctor = await ehrContractService.isDoctor();
  if (!isDoctor) {
    // console.log("doctor not found");
    await router.navigateByUrl('/')
    return false
  }
  // console.log("Doctor Guard : true");
  return true;
};
