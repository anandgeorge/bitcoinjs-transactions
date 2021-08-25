function SigHashType(value, procedure) {
    this.value = value;
    this.procedure = procedure;
}

SigHashType.prototype.apply = function(tx, inputIndex, subscript) {
    var transaction = tx.clone();
    transaction.inputs.forEach(function(input) {
        input.script = [];
    });
    transaction.inputs[inputIndex].script = subscript;
    this.procedure(transaction, inputIndex, subscript);
    return transaction;
};

SigHashType.prototype.withAnyoneCanPay = function() {
    return new SigHash(this.value | SigHash.ANYONECANPAY);
};

SigHashType.ALL = new SigHashType(1, function() {
    // default procedure
});

SigHashType.NONE = new SigHashType(2, function() {
    throw new Error('Not implemented.');
});

SigHashType.SINGLE = new SigHashType(3, function() {
    throw new Error('Not implemented.');
});

function SigHash(value) {
    var type = (value & ~SigHash.ANYONECANPAY);
    for (var item in SigHashType) {
        if (SigHashType[item].value === type) {
            this.type = SigHashType[item];
            break;
        }
    }
    this.isAnyoneCanPay = !!(value & SigHash.ANYONECANPAY);
    this.value = value;
}

SigHash.ANYONECANPAY = 0x80;

SigHash.prototype.apply = function(tx, inputIndex, subscript) {
    var transaction = this.type.apply(tx, inputIndex, subscript);
    if (this.isAnyoneCanPay) {
        // leave only one input — the spending one
        transaction.inputs = [transaction.inputs[inputIndex]];
    }
    return transaction;
};