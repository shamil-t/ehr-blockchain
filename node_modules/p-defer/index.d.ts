export interface DeferredPromise<ValueType> {
	/**
	The deferred promise.
	*/
	promise: Promise<ValueType>;

	/**
	Resolves the promise with a value or the result of another promise.

	@param value - The value to resolve the promise with.
	*/
	resolve(value?: ValueType | PromiseLike<ValueType>): void;

	/**
	Reject the promise with a provided reason or error.

	@param reason - The reason or error to reject the promise with.
	*/
	reject(reason?: unknown): void;
}

/**
Create a deferred promise.

@example
```
import pDefer from 'p-defer';

function delay(milliseconds) {
	const deferred = pDefer();
	setTimeout(deferred.resolve, milliseconds, '🦄');
	return deferred.promise;
}

console.log(await delay(100));
//=> '🦄'
```
*/
export default function pDefer<ValueType>(): DeferredPromise<ValueType>;
