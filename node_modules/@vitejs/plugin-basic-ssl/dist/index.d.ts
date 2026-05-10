import { Plugin } from 'vite';

declare function viteBasicSslPlugin(): Plugin;
declare function getCertificate(cacheDir: string): Promise<string>;

export { viteBasicSslPlugin as default, getCertificate };
