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