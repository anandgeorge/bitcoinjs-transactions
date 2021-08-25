var fs = require('fs');
var _ = require('lodash');

var littleendian = function(str) {
    return str.match(/.{2}/g).reverse().join('');
}

var readVarInt = function(str, idx) {
    var num = parseInt(str.substr(idx,2), 16);
    if (num < 0xfd) {
        return {txlen: num, idx:idx+2};
    } else if (num === 0xfd) {
        idx += 2
        var inc = 4;
        return {txlen: parseInt(littleendian(str.substr(idx,inc)),16), idx:idx+inc};
    } else if (num === 0xfe) {
        idx += 2
        var inc = 8;
        return {txlen: parseInt(littleendian(str.substr(idx,inc)),16), idx:idx+inc};
    } else {
        idx +=2
        var inc = 16;
        return {txlen: parseInt(littleendian(str.substr(idx,inc)),16), idx:idx+inc};
    }
}

function parseBlocks(data) {
    var arr = data.split('f9beb4d9');
    var final = [];
    arr.shift();
    _.map(arr, function(at, idx) {
        var len = parseInt(littleendian(at.substr(0,8)),16);
        var ver = parseInt(littleendian(at.substr(8,8)),16);
        var previous = littleendian(at.substr(16,64));
        var merkle = littleendian(at.substr(80,64));
        var timestamp = new Date(parseInt(littleendian(at.substr(144,8)),16) * 1000);
        var target = littleendian(at.substr(152,8));
        var nonce = littleendian(at.substr(160,8));
        var tx = readVarInt(at,168);
        var txlen = tx.txlen;
        var txidx = tx.idx;
        var txidxcounter = 0;
        var txstr = at.substr(txidx);
        final.push({height:idx, previous:previous, hash:merkle, ts:timestamp, txlen: txlen, nonce:nonce, target:target})
    })
    console.log(JSON.stringify(final.splice(50,5)), final.length)    
}


var files = fs.readdirSync('/root/.bitcoin/blocks/').sort();
// var files = fs.readdirSync('/Users/anandgeorge/Library/Application\ Support/Bitcoin/blocks/').sort();
files = _.filter(files, function(ft) {
    return ft.indexOf('blk') > -1
    // return ft.indexOf('blk') > -1 && ft !== 'blk00023.dat'  && ft !== 'blk00023.dat'
})

_.map(files, function(ft) {
    // var data = fs.readFileSync('blk00004.dat', 'hex');
    var data = fs.readFileSync('/root/.bitcoin/blocks/' + ft, 'hex');
    // var data = fs.readFileSync('/Users/anandgeorge/Library/Application\ Support/Bitcoin/blocks/' + ft, 'hex');
    console.log(ft);
    parseBlocks(data);
})









