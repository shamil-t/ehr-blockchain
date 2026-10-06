import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EventEmitter, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {EhrWalletService} from '../ehr-wallet.service';
import {ProviderService} from '../provider.service';
import {WalletState} from '../wallet-state.enum';
import {WalletPageComponent} from './wallet-page.component';

describe('WalletPageComponent', () => {
  let fixture: ComponentFixture<WalletPageComponent>;
  let component: WalletPageComponent;
  let state: ReturnType<typeof signal<WalletState>>;
  let address: ReturnType<typeof signal<string | null>>;
  let providerStatus: ReturnType<typeof signal<'CONNECTED' | 'DISCONNECTED' | 'WRONG_NETWORK' | 'CHECKING'>>;
  let createWallet: jasmine.Spy;
  let signOut: jasmine.Spy;
  let signMessage: jasmine.Spy;
  let sendTransaction: jasmine.Spy;
  let queryParams: EventEmitter<{get(key: string): string | null}>;
  let navigate: jasmine.Spy;

  const walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

  beforeEach(async () => {
    state = signal(WalletState.NO_WALLET);
    address = signal<string | null>(null);
    providerStatus = signal<'CONNECTED' | 'DISCONNECTED' | 'WRONG_NETWORK' | 'CHECKING'>('CONNECTED');
    queryParams = new EventEmitter<{get(key: string): string | null}>();
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    createWallet = jasmine.createSpy('createWallet').and.callFake(async () => {
      address.set(walletAddress);
      state.set(WalletState.LOCKED);
      return walletAddress;
    });
    signOut = jasmine.createSpy('signOut').and.callFake(async () => {
      address.set(null);
      state.set(WalletState.NO_WALLET);
    });
    signMessage = jasmine.createSpy('signMessage').and.resolveTo('0xsigned');
    sendTransaction = jasmine.createSpy('sendTransaction').and.resolveTo('0xtransaction');

    await TestBed.configureTestingModule({
      imports: [WalletPageComponent],
      providers: [
        {
          provide: EhrWalletService,
          useValue: {
            state,
            address,
            initialize: async () => undefined,
            createWallet,
            validatePrivateKey: () => walletAddress,
            validateAddress: (value: string) => value,
            importWalletFromPrivateKey: async () => walletAddress,
            unlock: async () => undefined,
            lock: () => state.set(WalletState.LOCKED),
            signOut,
            isUnlocked: () => state() === WalletState.UNLOCKED,
            getAddress: () => address(),
            getBalance: async () => '12.5',
            signMessage,
            estimateTransaction: async () => '0.00042',
            sendTransaction
          }
        },
        {
          provide: ProviderService,
          useValue: {
            status: providerStatus,
            chainId: signal<number | null>(31337),
            expectedChainId: 31337,
            networkName: 'Anvil Local',
            checkStatus: async () => undefined
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable()
          }
        },
        {provide: Router, useValue: {navigate}}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows create and import actions without signing actions when no wallet exists', () => {
    expect(fixture.nativeElement.textContent).toContain('Create new wallet');
    expect(fixture.nativeElement.textContent).toContain('Import existing wallet');
    expect(fixture.nativeElement.textContent).not.toContain('Sign a message');
  });

  it('keeps dialogs open when the backdrop or Escape is used and closes from the close button', () => {
    component.openDialog('create');
    fixture.detectChanges();

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.dialog-backdrop');
    backdrop.click();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(component.dialog()).toBe('create');

    fixture.nativeElement.querySelector('.dialog-close').click();
    expect(component.dialog()).toBeNull();
  });

  it('shows the address and unlock action while locked', async () => {
    state.set(WalletState.LOCKED);
    address.set(walletAddress);
    await component.refreshBalance();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0x71C765...d8976F');
    expect(fixture.nativeElement.textContent).toContain('12.5');
    expect(fixture.nativeElement.textContent).toContain('Unlock wallet');
    expect(fixture.nativeElement.textContent).not.toContain('Sign a message');
  });

  it('opens the unlock dialog from the navigation shortcut and clears its query parameter', async () => {
    state.set(WalletState.LOCKED);
    address.set(walletAddress);

    await component.ngOnInit();
    queryParams.emit({get: (key: string) => key === 'unlock' ? 'true' : null});
    fixture.detectChanges();

    expect(component.dialog()).toBe('unlock');
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: {unlock: null},
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  });

  it('shows authorized actions only when unlocked', () => {
    state.set(WalletState.UNLOCKED);
    address.set(walletAddress);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sign a message');
    expect(fixture.nativeElement.textContent).toContain('Send transaction');
    expect(fixture.nativeElement.textContent).toContain('Lock wallet');
  });

  it('blocks writes and reports a wrong network independently of wallet state', () => {
    state.set(WalletState.UNLOCKED);
    address.set(walletAddress);
    providerStatus.set('WRONG_NETWORK');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unexpected network');
    expect(fixture.nativeElement.textContent).toContain('Expected chain 31337');
    expect(component.canWrite).toBeFalse();
  });

  it('shows RPC unavailability without changing wallet state', () => {
    providerStatus.set('DISCONNECTED');
    fixture.detectChanges();

    expect(state()).toBe(WalletState.NO_WALLET);
    expect(fixture.nativeElement.textContent).toContain('RPC unavailable');
    expect(fixture.nativeElement.textContent).toContain('Unable to connect');
  });

  it('calls wallet creation only after password validation', async () => {
    component.password = 'short';
    component.confirmPassword = 'short';
    await component.createWallet();
    expect(createWallet).not.toHaveBeenCalled();

    component.password = 'CorrectHorse!42';
    component.confirmPassword = 'CorrectHorse!42';
    await component.createWallet();
    expect(createWallet).toHaveBeenCalledOnceWith('CorrectHorse!42');
    expect(address()).toBe(walletAddress);
  });

  it('delegates message signing to the wallet service', async () => {
    state.set(WalletState.UNLOCKED);
    address.set(walletAddress);
    component.openDialog('sign');
    component.message = 'Verify EHR wallet ownership';
    await component.signMessage();

    expect(signMessage).toHaveBeenCalledOnceWith('Verify EHR wallet ownership');
    expect(component.dialog()).toBe('signed');
  });

  it('clears the wallet to locked state immediately', () => {
    state.set(WalletState.UNLOCKED);
    address.set(walletAddress);
    component.lockWallet();
    fixture.detectChanges();

    expect(state()).toBe(WalletState.LOCKED);
    expect(fixture.nativeElement.textContent).not.toContain('Sign a message');
    expect(fixture.nativeElement.textContent).toContain('Unlock wallet');
  });

  it('signs out and returns to wallet setup actions', async () => {
    state.set(WalletState.LOCKED);
    address.set(walletAddress);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sign out');
    component.openDialog('sign-out');
    await component.signOutWallet();
    fixture.detectChanges();

    expect(signOut).toHaveBeenCalledOnceWith();
    expect(address()).toBeNull();
    expect(state()).toBe(WalletState.NO_WALLET);
    expect(fixture.nativeElement.textContent).toContain('Create new wallet');
    expect(fixture.nativeElement.textContent).toContain('Import existing wallet');
  });

  it('shows only the derived address during import confirmation', () => {
    const privateKey = '0x' + 'a'.repeat(64);
    component.openDialog('import');
    component.privateKey = privateKey;
    component.password = 'CorrectHorse!42';
    component.confirmPassword = 'CorrectHorse!42';
    component.prepareImport();
    fixture.detectChanges();

    expect(component.dialog()).toBe('import-confirm');
    expect(fixture.nativeElement.textContent).toContain(walletAddress);
    expect(fixture.nativeElement.textContent).not.toContain(privateKey);
  });

  it('does not send a transaction until explicit confirmation', async () => {
    state.set(WalletState.UNLOCKED);
    address.set(walletAddress);
    component.toAddress = '0xAB12AB12AB12AB12AB12AB12AB12AB12AB1291DE';
    component.valueEth = '0';
    await component.prepareTransaction();

    expect(sendTransaction).not.toHaveBeenCalled();
    expect(component.transactionState()).toBe('CONFIRMING');

    await component.confirmTransaction();
    expect(sendTransaction).toHaveBeenCalledOnceWith(component.toAddress, '0');
    expect(component.transactionState()).toBe('SUCCESS');
  });
});
