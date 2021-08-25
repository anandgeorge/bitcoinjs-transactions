var BigInteger = require('bigi')

var hex = {
    decode: function(text) {
        return text.match(/.{2}/g).map(function(byte) {
            return parseInt(byte, 16);
        });
    },
    encode: function(bytes) {
        var result = [];
        for (var i = 0, hex; i < bytes.length; i++) {
            hex = bytes[i].toString(16);
            if (hex.length < 2) {
                hex = '0' + hex;
            }
            result.push(hex);
        }
        return result.join('');
    }
};

var littleEndian = {
    decode: function(bytes) {
        return bytes.reduce(function(previous, current, index) {
            return previous + current * Math.pow(256, index);
        }, 0);
    },
    encode: function(number, count) {
        var rawBytes = [];
        for (var i = 0; i < count; i++) {
            rawBytes[i] = number & 0xff;
            number = Math.floor(number / 256);
        }
        return rawBytes;
    }
};

var base58 = {
    _codes: '123456789ABCDEFGHJKLMNPQRSTUVWXYZ' +
        'abcdefghijkmnopqrstuvwxyz',
    _58: new BigInteger('58'),
    encode: function(bytes) {
        var number = new BigInteger(bytes);

        var output = [];

        while (number.compareTo(BigInteger.ZERO) > 0) {
            var result = number.divideAndRemainder(this._58);
            number = result[0];
            var remainder = result[1];
            output.push(this._codes.charAt(remainder));
        }

        // preserve leading zeros
        for (var i = 0; i < bytes.length; i++) {
            if (bytes[i] !== 0) {
                break;
            }
            output.push(this._codes[0]);
        }
        return output.reverse().join('');
    },
    decode: function(string) {
        var result = BigInteger.ZERO;
        var output = [], code, power;
        for (var i = 0; i < string.length; i++) {
            code = this._codes.indexOf(string.charAt(i));

            // preserve leading zeros
            if (result.equals(BigInteger.ZERO) && code === 0) {
                output.push(0);
            }
            power = this._58.pow(string.length - i - 1);
            code = new BigInteger('' + code);
            result = result.add(code.multiply(power));
        }
        output.push.apply(output, result.toByteArrayUnsigned());
        return output;
    }
};