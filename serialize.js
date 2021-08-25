function ArraySink(rawBytes) {
    this.rawBytes = rawBytes;
}

ArraySink.prototype = {
    writeByte: function(byte) {
        this.rawBytes.push(byte);
    },
    writeBytes: function(bytes) {
        Array.prototype.push.apply(this.rawBytes, bytes);
    },
    writeInt: function(number, count) {
        this.writeBytes(littleEndian.encode(number, count));
    },
    writeVarInt: function(num) {
        if (num < 0xfd) {
            this.writeByte(num);
        } else if (num <= 0xffff) {
            this.writeByte(0xfd);
            this.writeBytes(littleEndian.encode(num, 2));
        } else {
            throw new Error('Not implemented.');
        }
    },
    writeString: function(bytes) {
        this.writeVarInt(bytes.length);
        this.writeBytes(bytes);
    },
    writeHexBytes: function(text) {
        this.writeBytes(hex.decode(text).reverse())
    }
};