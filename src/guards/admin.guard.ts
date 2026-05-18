import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {EhrContractService} from "../services/ehr-contract.service";

export const adminGuard: CanActivateChildFn = async (_route, _state) => {
  const ehrContractService = inject(EhrContractService);
  const router = inject(Router);

  const isAdmin = await ehrContractService.isAdmin();
  // console.log("Admin guard", isAdmin);
  if (!isAdmin) {
    await router.navigateByUrl('/')
  }
  return true;
};
