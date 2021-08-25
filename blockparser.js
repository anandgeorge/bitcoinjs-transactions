var fs = require('fs');
var FileReader = require('filereader')

// var stream = fs.readFileSync('blk00092.dat');

var Script = (function() {
    var opcodes = {
        0x00: 'FALSE',

        // Operators 0x00-0x4b push next _opcode_ bytes on the stack
        // e.g. 0x02 pushes next 2 bytes as a one two byte vector item

        // Operators 0x51-0x60 push number (opcode — 0x50) on the stack
        // e.g. 0x52 pushes number 2 as a byte vector

        // Flow control
        0x63: 'IF',
        0x67: 'ELSE',
        0x68: 'ENDIF',
        0x69: 'VERIFY',

        // Stack
        0x76: 'DUP',
        0x77: 'NIP',
        0x7a: 'ROLL',
        0x7b: 'ROT',
        0x7c: 'SWAP',
        0x7d: 'TUCK',

        // Splice
        0x82: 'SIZE',

        // Bitwise logic
        0x87: 'EQUAL',
        0x88: 'EQUALVERIFY',

        // Arithmetic
        0x93: 'ADD',
        0x94: 'SUB',
        0x9a: 'BOOLAND',
        0x9b: 'BOOLOR',
        0xa0: 'GREATERTHAN',
        0xa5: 'WITHIN',

        // Crypto
        0xa8: 'SHA256',
        0xa9: 'HASH160',
        0xac: 'CHECKSIG',
        0xad: 'CHECKSIGVERIFY',
        0xae: 'CHECKMULTISIG'
    };

    var readScript = function*(stream) {
        var instructions = [];
        while (stream.hasMoreBytes()) {
            var opcode = yield stream.readByte();
            if (opcode === 0x00) {
                instructions.push('OP_FALSE');
            } else if (opcode <= 0x4b) {
                var bytes = yield stream.readBytes(opcode);
                instructions.push(hex.encode(bytes));
            } else if (opcode >= 0x51 && opcode <= 0x60) {
                var num = opcode - 0x50;
                instructions.push('OP_' + num);
            } else if (opcode in opcodes) {
                instructions.push('OP_' + opcodes[opcode]);
            } else {
                throw new Error('Unknown opcode: ' + opcode);
            }
        }
        return instructions;
    };

    function writeScript(instructions) {
        var bytes = [];
        instructions.forEach(function(opcode) {
            var num = opcode.match(/^OP_([1-9]|1[0-6])$/);
            if (num) {
                bytes.push(parseInt(num[1], 10) + 0x50);
                return;
            } else if (opcode.match(/^([a-f0-9][a-f0-9])+$/g)) {
                bytes.push(opcode.length / 2);
                bytes.push.apply(bytes, hex.decode(opcode));
                return;
            } else {
                for (var code in opcodes) {
                    if (opcode === ('OP_' + opcodes[code])) {
                        bytes.push(parseInt(code, 10));
                        return;
                    }
                }
            }
            throw new Error('Unknown opcode: ' + opcode);
        });
        return bytes;
    }

    return {
        readScript: function(script) {
            try {
                var stream = new Stream(new ArraySource(script));
                return sync(readScript(stream));
            } catch (e) {
                console.warn('Cannot parse script: ' + e, script);
                return script;
            }
        },
        writeScript: writeScript
    };

}());

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

function Stream(source) {
    this.source = source;
}

Stream.prototype = {
    readByte: function() {
        return this.source.readByte();
    },
    readBytes: function*(num) {
        var bytes = [];
        for (var i = 0; i < num; i++) {
            bytes.push(yield this.readByte());
        }
        return bytes;
    },
    readInt: function*(num) {
        var bytes = yield this.readBytes(num);
        return littleEndian.decode(bytes);
    },
    readVarInt: function*() {
        var num = yield this.readByte();
        if (num < 0xfd) {
            return num;
        } else if (num === 0xfd) {
            return this.readInt(2);
        } else if (num === 0xfe) {
            return this.readInt(4);
        } else {
            return this.readInt(8);
        }
    },
    readString: function*() {
        var length = yield this.readVarInt();
        return this.readBytes(length);
    },
    readHexBytes: function*(num) {
        var bytes = yield this.readBytes(num);
        return hex.encode(bytes.reverse());
    },
    hasMoreBytes: function() {
        return this.source.hasMoreBytes();
    },
    getPosition: function() {
        return this.source.getPosition();
    }
};

function Block() {
}

Block.parse = function*(stream) {
    var findMagicNumber = function*(stream, octet) {
    	console.log('In find magic number', stream);
        while (octet !== 0xf9) {
            octet = yield stream.readByte();
        }
        octet = yield stream.readByte();
        if (octet !== 0xbe) {
            return findMagicNumber(stream, octet);
        }
        octet = yield stream.readByte();
        if (octet !== 0xb4) {
            return findMagicNumber(stream, octet);
        }
        octet = yield stream.readByte();
        if (octet !== 0xd9) {
            return findMagicNumber(stream, octet);
        }
    };

    yield findMagicNumber(stream);

    var block = new Block();

    block.length = yield stream.readInt(4);
    block.version = yield stream.readInt(4);
    block.previousBlockHash = hex.encode(yield stream.readBytes(32));
    block.merkleRoot = hex.encode(yield stream.readBytes(32));
    block.timeStamp = new Date((yield stream.readInt(4)) * 1000);
    block.target = yield stream.readInt(4);
    block.nonce = yield stream.readInt(4);
    block.transactions = [];

    var transactionCount = yield stream.readVarInt();
    for (var i = 0; i < transactionCount; i++) {
        block.transactions.push(yield Transaction.parse(stream));
    }

    return block;
};

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

function ArraySource(rawBytes, index) {
    this.rawBytes = rawBytes;
    this.index = index || 0;
}

ArraySource.prototype = {
    readByte: function() {
        if (!this.hasMoreBytes()) {
            throw new Error('Cannot read past the end of the array.');
        }
        return this.rawBytes[this.index++];
    },
    hasMoreBytes: function() {
        return this.index < this.rawBytes.length;
    },
    getPosition: function() {
        return this.index;
    }
};

function FileSource(file, index, chunkSize) {
    if (!file) {
        throw new Error('Argument file not defined.');
    }
    this.file = file;
    this.index = index || 0;
    this.chunkSize = chunkSize || (1024 * 1024);
    this.buffer = new ArraySource([]);
    this.reader = new FileReader();
}

FileSource.prototype = {
    readByte: function() {
        if (this.buffer.hasMoreBytes()) {
            return Promise.resolve(this.buffer.readByte());
        }
        if (!this.hasMoreBytes()) {
            var err = Error('Cannot read past the end of file.');
            return Promise.reject(err);
        }
        var _this = this;
        return this._readBytes().then(function(rawBytes) {
            _this.buffer = new ArraySource(rawBytes);
            return _this.readByte();
        });
    },
    hasMoreBytes: function() {
        return this.index < this.file.size;
    },
    getPosition: function() {
        return this.index - this.chunkSize + this.buffer.getPosition();
    },
    _readBytes: function() {
        return new Promise(function(resolve, reject) {
            this.reader.onload = function(e) {
                var bytes = new Uint8Array(e.target.result);
                resolve(bytes);
            };
            this.reader.onerror = reject;
            var index = this.index;
            var blob = this.file.slice(index, index + this.chunkSize);
            this.reader.readAsArrayBuffer(blob);
            this.index += this.chunkSize;
        }.bind(this));
    }
};

var stream = fs.createReadStream('blk00092.dat');
console.log(stream.read(4));
// var stream = new Stream(new FileSource('blk00092.dat'));

// var block = Block.parse(stream);
// console.log(block);

// async(findStrangeTransactions(stream)).then(function(obj) {
//     delete obj.block.transactions;
//     if (obj.generation.inputs[0].script.length > 10) {
//         obj.generation.inputs[0].script = '[truncated]';
//     }
//     output.textContent = JSON.stringify(obj, null, 2);
// }, console.error.bind(console));

// var parsedblock = Block.parse(stream);
// console.log(parsedblock);

