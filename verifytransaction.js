function hashTransaction(tx, spendingInputIndex, subscript, sigHash) {

    // transform transaction according to SIGHASH procedure
    var transaction = sigHash.apply(tx, spendingInputIndex, subscript);

    // serialize transaction
    var bytes = [], sink = new ArraySink(bytes);
    transaction.serializeInto(sink);

    // append sighash value
    sink.writeInt(sigHash.value, 4);

    return digest.sha256(digest.sha256(bytes));
}

function checkSignature(previousTx, newTx, inputIndex,
        signature, pubKey) {

    var spendingInput = newTx.inputs[inputIndex];
    var output = previousTx.outputs[spendingInput.previousTxOutIndex];
    var subscript = output.script;

    // last byte of signature is hash type
    var hashType = new SigHash(signature[signature.length - 1]);

    var hash = hashTransaction(newTx, inputIndex, subscript, hashType);

    try {
        return ecdsa.verify(hash, signature, pubKey);
    } catch (e) {
        console.warn('Signature verification failed', e);
        return false;
    }
}