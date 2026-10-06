import {Injectable} from '@angular/core';
import {IPFS} from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  private readonly apiUrl = IPFS.localIPFS.replace(/\/+$/, '');

  async getJsonData<T>(ipfsHash: string): Promise<T> {
    return JSON.parse(await this.getIpfsData(ipfsHash)) as T;
  }

  getImageUrl(ipfsHash: string): string {
    const hash = ipfsHash.trim();
    if (!hash) return '';

    const gatewayBase = IPFS.localIPFSGet
      .replace(/\/ipfs\/?$/i, '')
      .replace(/\/+$/, '');
    const path = hash
      .replace(/^ipfs:\/\//i, '')
      .replace(/^\/?ipfs\//i, '')
      .replace(/^\/+/, '');

    return `${gatewayBase}/ipfs/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  async addFile(file: File): Promise<{path: string}> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.add(form);
  }

  async addRecord(data: unknown): Promise<string> {
    const form = new FormData();
    form.append('file', new Blob([JSON.stringify(data)], {type: 'application/json'}), 'record.json');
    return (await this.add(form)).path;
  }

  private async getIpfsData(ipfsHash: string): Promise<string> {
    const url = new URL(`${this.apiUrl}/cat`);
    url.searchParams.set('arg', ipfsHash);
    const response = await fetch(url, {method: 'POST'});
    return this.readResponse(response);
  }

  private async add(form: FormData): Promise<{path: string}> {
    const response = await fetch(`${this.apiUrl}/add`, {method: 'POST', body: form});
    const body = await this.readResponse(response);
    const result = JSON.parse(body.split(/\r?\n/).filter(Boolean).at(-1) ?? '{}') as {Hash?: string};

    if (!result.Hash) {
      throw new Error('IPFS add response did not contain a content hash');
    }

    return {path: result.Hash};
  }

  private async readResponse(response: Response): Promise<string> {
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`IPFS request failed (${response.status} ${response.statusText}): ${body}`);
    }
    return body;
  }
}
