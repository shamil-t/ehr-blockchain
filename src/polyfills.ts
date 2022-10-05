/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
 import 'zone.js';  // Included with Angular CLI.
 import * as process from 'process';
 
 // window.process = process
 
 window['process'] = process;
 /***************************************************************************************************
  * APPLICATION IMPORTS
  */
  (window as any)['global'] = window;
 
  global.Buffer = global.Buffer || require('buffer').Buffer;
