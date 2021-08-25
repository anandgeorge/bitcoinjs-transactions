function Block() {
}

Block.parse = function*(stream) {

    var findMagicNumber = function*(stream, octet) {
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