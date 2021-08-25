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