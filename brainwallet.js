function getAddressFromPublicKey(publicKey) {
    var hash = digest.ripemd160(digest.sha256(publicKey));

    hash.unshift(0x00); // version byte, 0x00 for the main network

    var checksum = digest.sha256(digest.sha256(hash)).slice(0, 4);

    return base58.encode(hash.concat(checksum));
}

var passphrase = 'correct horse battery staple';

var passbytes = passphrase.split('').map(function(letter) {
    return letter.charCodeAt(0);
});

var privateKey = digest.sha256(passbytes);

log('Private key', hex.encode(privateKey));

var publicKey = ecdsa.getPublicKey(privateKey);

log('Public key', hex.encode(publicKey));

log('Address', getAddressFromPublicKey(publicKey));