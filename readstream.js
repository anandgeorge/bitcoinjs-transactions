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