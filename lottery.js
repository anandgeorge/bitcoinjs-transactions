var tx = new Transaction();

tx.inputs.push({
    previousTxHash: '7ae5760af2105a5ba54a914f188686e2743ead50cd690afb7e609f7b99e0ae31',
    previousTxOutIndex: 0,
    script: [
        '3045022100a27c9532f4eb90240f598aa4c3ad43bc604fb4464688dad8113a943212d6638f022035ff6f215a4a432590d987f9c8ea839678506904a97643e8e99371b991b9438001',
        '3046022100b9d333b096a2a19bf6aa142aa429e7feb4d400b7af82bed4f5eca3ea7b7e83ec02210082d5be5da0a523c9c6e86ecf48f16cfbe3b32def49c92ce376cc87aa7467608601',
        '00'
    ],
    sequenceNo: '00000000'
});

tx.outputs.push({
    value: 45000,
    script: [
        'OP_DUP',
        'OP_HASH160',
        '62a2486468040e8a1a1f91d8949ac4dc838a0ed2',
        'OP_EQUALVERIFY',
        'OP_CHECKSIG'
    ]
});

tx.lockTime = 1384457550;

log('Is final now?', tx.isFinal(310280, Date.now()));

var dateInPast = new Date('2013-11-14T15:32:30.000Z');

log('Was final ' + dateInPast + '?', tx.isFinal(310280, dateInPast))