var StackWrapper = (function() {

    function StackWrapper(stack) {
        this.stack = stack;
    }

    StackWrapper.prototype = {
        push: function(value) {
            this.stack.push(value);
            this.length = this.stack.length;
        },
        pop: function() {
            this.length = this.stack.length - 1;
            return this.stack.pop();
        },
        splice: function(index, count) {
            this.length = this.stack.length - count;
            return this.stack.splice(index, count);
        },
        pushNumber: function(number) {
            this.push(littleEndian.encode(number, 1));
        },
        pushBoolean: function(boolean) {
            this.push(booleanToNumber(boolean));
        },
        popNumber: function() {
            return littleEndian.decode(this.pop());
        },
        popBoolean: function() {
            return numberToBoolean(this.pop());
        }
    };

    var FALSE = [], TRUE = [1];

    function numberToBoolean(value) {
        if (value.length === 0) {
            return false;
        } else {
            for (var i = 0; i < value.length; i++) {
                if (value[i] !== 0) {
                    if (i === value.length - 1 && value[i] === 0x80) {
                        return false;
                    }
                    return true;
                }
            }
            return false;
        }
    }

    function booleanToNumber(value) {
        return value ? TRUE : FALSE;
    }

    return StackWrapper;

}());

function createInterpreter(stack, checkSignature) {
    var executes = [];

    var context = {
        pushExecute: function(execute) {
            executes.push(execute);
        },
        flipExecute: function(execute) {
            executes.push(!executes.pop());
        },
        popExecute: function() {
            executes.pop();
        },
        canExecute: function() {
            return executes.every(function(execute) {
                return !!execute;
            });
        },
        checkSignature: checkSignature
    };

    stack = new StackWrapper(stack);

    function isConditional(instruction) {
        return instruction === 'OP_IF' || instruction === 'OP_ELSE' ||
            instruction === 'OP_ENDIF';
    }

    return function(instruction) {
        if (isConditional(instruction) || context.canExecute()) {
            var num = instruction.match(/^OP_([1-9]|1[0-6])$/);
            if (num) {
                stack.pushNumber(parseInt(num[1], 10));
            } else if (instruction.match(/^([a-f0-9][a-f0-9])+$/)) {
                stack.push(hex.decode(instruction));
            } else if (instruction in operators) {
                operators[instruction](stack, context);
            } else {
                throw new Error('Not implemented: ' + instruction);
            }
            return true;
        }
        return false;
    };
}