var operators = {
    OP_DUP: function(stack) {
        var value = stack.pop();
        stack.push(value);
        stack.push(value);
    },
    OP_SHA256: function(stack) {
        var value = stack.pop();
        stack.push(digest.sha256(value));
    },
    OP_HASH160: function(stack) {
        var value = stack.pop();
        stack.push(digest.ripemd160(digest.sha256(value)));
    },
    OP_EQUAL: function(stack) {
        var value1 = stack.pop();
        var value2 = stack.pop();
        if (value1.length !== value2.length) {
            stack.pushBoolean(false);
            return;
        }
        for (var i = 0; i < value1.length; i++) {
            if (value1[i] !== value2[i]) {
                stack.pushBoolean(false);
                return;
            }
        }
        stack.pushBoolean(true);
    },
    OP_VERIFY: function(stack) {
        var value = stack.popBoolean();
        if (!value) {
            stack.pushBoolean(value);
            throw new Error('Verify error.');
        }
    },
    OP_EQUALVERIFY: function(stack) {
        this.OP_EQUAL(stack);
        this.OP_VERIFY(stack);
    },
    OP_CHECKSIG: function(stack, context) {
        var pubKey = stack.pop();
        var signature = stack.pop();
        var valid = context.checkSignature(signature, pubKey);
        stack.pushBoolean(valid);
    },
    OP_CHECKSIGVERIFY: function(stack, context) {
        this.OP_CHECKSIG(stack, context);
        this.OP_VERIFY(stack);
    },
    OP_CHECKMULTISIG: function(stack, context) {
        var pubKeysCount = stack.popNumber();
        var pubKeys = [];
        for (var i = 0; i < pubKeysCount; i++) {
            pubKeys.push(stack.pop());
        }
        var sigsCount = stack.popNumber();
        var signatures = [];
        for (var i = 0; i < sigsCount; i++) {
            signatures.push(stack.pop());
        }
        stack.pop(); // dummy value
        var valid = signatures.every(function(signature) {
            return pubKeys.some(function(pubKey) {
                return context.checkSignature(signature, pubKey);
            });
        });
        stack.pushBoolean(valid);
    },
    OP_FALSE: function(stack) {
        stack.pushBoolean(false);
    },
    OP_SIZE: function(stack) {
        var element = stack.pop();
        stack.push(element);
        stack.push([element.length]);
    },
    OP_WITHIN: function(stack) {
        var max = stack.popNumber();
        var min = stack.popNumber();
        var element = stack.popNumber();
        stack.pushBoolean(min <= element && element < max);
    },
    OP_GREATERTHAN: function(stack) {
        var first = stack.popNumber();
        var second = stack.popNumber();
        stack.pushBoolean(second > first);
    },
    OP_ADD: function(stack) {
        var first = stack.popNumber();
        var second = stack.popNumber();
        stack.pushNumber(first + second);
    },
    OP_SUB: function(stack) {
        var first = stack.popNumber();
        var second = stack.popNumber();
        stack.pushNumber(second - first);
    },
    OP_SWAP: function(stack) {
        var value1 = stack.pop();
        var value2 = stack.pop();
        stack.push(value1);
        stack.push(value2);
    },
    OP_TUCK: function(stack) {
        var value1 = stack.pop();
        var value2 = stack.pop();
        stack.push(value1);
        stack.push(value2);
        stack.push(value1);
    },
    OP_ROT: function(stack) {
        var value1 = stack.pop();
        var value2 = stack.pop();
        var value3 = stack.pop();
        stack.push(value2);
        stack.push(value1);
        stack.push(value3);
    },
    OP_ROLL: function(stack) {
        var n = stack.popNumber();
        var value = stack.splice(stack.length - n - 1, 1);
        // splice returns an array with one element
        stack.push(value[0]);
    },
    OP_BOOLAND: function(stack) {
        var value1 = stack.popBoolean();
        var value2 = stack.popBoolean();
        stack.pushBoolean(value1 && value2);
    },
    OP_BOOLOR: function(stack) {
        var value1 = stack.popBoolean();
        var value2 = stack.popBoolean();
        stack.pushBoolean(value1 || value2);
    },
    OP_NIP: function(stack) {
        var value1 = stack.pop();
        var value2 = stack.pop();
        stack.push(value1);
    },
    OP_IF: function(stack, context) {
        var execute = context.canExecute() && stack.popBoolean();
        context.pushExecute(execute);
    },
    OP_ELSE: function(stack, context) {
        context.flipExecute();
    },
    OP_ENDIF: function(stack, context) {
        context.popExecute();
    }
};