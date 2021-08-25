var privateKey = new Uint8Array(32);

window.crypto.getRandomValues(privateKey);

log('Private key', hex.encode(privateKey));

var publicKey = ecdsa.getPublicKey(privateKey);

log('Public key', hex.encode(publicKey));

var bytes = hex.decode('01000000011f5e7131923054920104e5080983572c6e29366d0c7f95548398e7a1c80dfa23500000006b4830450221009ce31d9d621c4ef2a753cb238d8bbb4b02edaf17cea98d95945011b84448bd39022010c699f51a8d1399748ce57b3db3ccd7a076872fd564492df96b1c7ff5ad57e5012103a72a9fc1615f45b461534c0a035ea4ea228f86c11f52dbfa6997f1483dbcc21bffffffff0188130000000000001976a914da8df9cc99e719562b52c209ebea7e28b8b3c60b88ac00000000');

var txid = hex.encode(digest.sha256(digest.sha256(bytes)).reverse());

var stream = new Stream(new ArraySource(bytes));

var previous = sync(Transaction.parse(stream));

var current = new Transaction();

var inputIndex = 0;

var spendingInput = {
    previousTxHash: txid,
    previousTxOutIndex: 0,
    script: [], // script is empty for now
    sequenceNo: 'ffffffff'
};

current.inputs[inputIndex] = spendingInput;

current.outputs.push({
    value: 15000,
    script: [
        'OP_DUP',
        'OP_HASH160',
        '54000657e2b8ebed5b1a1565b17aec63583ddc66',
        'OP_EQUALVERIFY',
        'OP_CHECKSIG'
    ]
});

var signature = signTransaction(previous, current, inputIndex,
    SigHashType.ALL.withAnyoneCanPay(), privateKey);

log('Signature', hex.encode(signature));

var valid = checkSignature(previous, current, inputIndex,
    signature, publicKey);

log('Signature valid?', valid);

// finalize transaction by adding signature and publicKey

spendingInput.script.push(hex.encode(signature));
spendingInput.script.push(hex.encode(publicKey));

log('Complete transaction', JSON.stringify(current, null, 2));

var bytes = [];
current.serializeInto(new ArraySink(bytes));

log('Serialized transaction', hex.encode(bytes));