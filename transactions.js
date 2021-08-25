function Transaction(version, inputs, outputs, lockTime) {
    this.version = version || 1;
    this.inputs = inputs || [];
    this.outputs = outputs || [];
    this.lockTime = lockTime || 0;
}

Transaction.parse = function*(stream) {
    var transaction = new Transaction();
    transaction.version = yield stream.readInt(4);

    var txInNum = yield stream.readVarInt();
    for (var i = 0; i < txInNum; i++) {
        transaction.inputs.push({
            previousTxHash: yield stream.readHexBytes(32),
            previousTxOutIndex: yield stream.readInt(4),
            script: Script.readScript(yield stream.readString()),
            sequenceNo: yield stream.readHexBytes(4)
        });
    }

    var txOutNum = yield stream.readVarInt();
    for (var i = 0; i < txOutNum; i++) {
        transaction.outputs.push({
            value: yield stream.readInt(8),
            script: Script.readScript(yield stream.readString())
        });
    }

    transaction.lockTime = yield stream.readInt(4);

    return transaction;
};

Transaction.prototype.serializeInto = function(stream) {
    stream.writeInt(this.version, 4);

    stream.writeVarInt(this.inputs.length);
    for (var i = 0, input; input = this.inputs[i]; i++) {
        stream.writeHexBytes(input.previousTxHash);
        stream.writeInt(input.previousTxOutIndex, 4);
        stream.writeString(Script.writeScript(input.script));
        stream.writeHexBytes(input.sequenceNo);
    }

    stream.writeVarInt(this.outputs.length);
    for (var i = 0, output; output = this.outputs[i]; i++) {
        stream.writeInt(output.value, 8);
        stream.writeString(Script.writeScript(output.script));
    }

    stream.writeInt(this.lockTime, 4);
};

Transaction.prototype.clone = function() {
    var copy = JSON.parse(JSON.stringify(this));
    return new Transaction(copy.version, copy.inputs, copy.outputs, copy.lockTime);
};

Transaction.prototype.isFinal = function(blockHeight, currentTimeMs) {
    var LOCKTIME_THRESHOLD = 500000000;
    if (this.lockTime === 0) {
        return true;
    }
    var threshold;
    if (this.lockTime < LOCKTIME_THRESHOLD) {
        threshold = blockHeight;
    } else {
        threshold = currentTimeMs / 1000;
    }
    if (this.lockTime < threshold) {
        return true;
    }
    function isInputFinal(input) {
        return input.sequenceNo === 'ffffffff' /* UINT_MAX */;
    }
    if (this.inputs.every(isInputFinal)) {
        return true;
    }
    return false;
};