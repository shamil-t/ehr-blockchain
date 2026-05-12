import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {BlockchainService} from "../services/blockchain.service";

export const adminGuard: CanActivateChildFn = async (route, state) => {
  const blockchainService = inject(BlockchainService);
  const router = inject(Router);

  const isAdmin = await blockchainService.checkIsAdmin();
  // console.log(isAdmin);
  if (!isAdmin) {
    // console.log(blockchainService.account())
    await router.navigateByUrl('/')
  }
  return true;
};
