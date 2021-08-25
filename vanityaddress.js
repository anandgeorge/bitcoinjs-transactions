var startWith = '1C';

var privateKey = new Uint8Array(32), start = performance.now();
var publicKey, address;

do {
    window.crypto.getRandomValues(privateKey);

    publicKey = ecdsa.getPublicKey(privateKey);

    address = getAddressFromPublicKey(publicKey);

} while (address.indexOf(startWith) !== 0);

log('Looking for key took (ms)', performance.now() - start);

log('Private key', hex.encode(privateKey));

log('Public key', hex.encode(publicKey));

log('Address', address);