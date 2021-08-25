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