/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IpfsService } from './ipfs.service';

describe('Service: Ipfs', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IpfsService]
    });
  });

  it('should ...', inject([IpfsService], (service: IpfsService) => {
    expect(service).toBeTruthy();
  }));
});
