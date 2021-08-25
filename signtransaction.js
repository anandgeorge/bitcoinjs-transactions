function signTransaction(previousTx, newTx, inputIndex, sigHash,
        privateKey) {

    var spendingInput = newTx.inputs[inputIndex];
    var output = previousTx.outputs[spendingInput.previousTxOutIndex];
    var subscript = output.script;

    var hash = hashTransaction(newTx, inputIndex, subscript, sigHash);

    return ecdsa.sign(hash, privateKey).concat(sigHash.value);
}