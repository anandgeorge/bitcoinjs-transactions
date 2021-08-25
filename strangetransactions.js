function getOutputScriptType(script) {
    if (script.length === 2 && script[1] === 'OP_CHECKSIG') {
        return 'pubkey';
    } else if (script.length === 5 &&
            script[0] === 'OP_DUP' &&
            script[1] === 'OP_HASH160' &&
            script[3] === 'OP_EQUALVERIFY' &&
            script[4] === 'OP_CHECKSIG') {
        return 'pubkeyhash';
    } else if (script[0] === 'OP_1' &&
            script[script.length - 1] === 'OP_CHECKMULTISIG') {
        return 'onemultisig';
    } else if (script[0] === 'OP_2' &&
            script[3] == 'OP_2' &&
            script[script.length - 1] === 'OP_CHECKMULTISIG') {
        return 'twomultisig';
    } else if (script.length === 3 &&
            script[0] === 'OP_HASH160' &&
            script[2] === 'OP_EQUAL') {
        return 'hash';
    } else if (script[0] === 'OP_RETURN') {
        return 'destroy';
    } else {
        return 'unknown';
    }
}

var findStrangeTransactions = function*(stream) {
    var block = yield Block.parse(stream);
    var strange = block.transactions.filter(function(transaction) {
        return transaction.outputs.some(function(output) {
            return getOutputScriptType(output.script) === 'unknown';
        });
    });
    var stats = block.transactions.reduce(function(stats, tx) {
        tx.outputs.forEach(function(output) {
            var type = getOutputScriptType(output.script);
            if (type in stats) {
                stats[type]++;
            } else {
                stats[type] = 1;
            }
        });
        return stats;
    }, {});
    var generation = block.transactions[0];
    // decode messages in input scripts
    var decoded = [];
    generation.inputs[0].script.forEach(function(instr) {
        if (instr.length > 20) {
            decoded.push(hex.decode(instr).map(function(char) {
                return String.fromCharCode(char);
            }).join(''));
        }
    });
    generation.inputs[0].decodedScript = decoded;
    return {
        block: block,
        generation: block.transactions[0],
        outputStatistics: stats,
        strangeTransactions: strange
    };
};