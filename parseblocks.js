async(findStrangeTransactions(window.stream)).then(function(obj) {
    delete obj.block.transactions;
    if (obj.generation.inputs[0].script.length > 10) {
        obj.generation.inputs[0].script = '[truncated]';
    }
    output.textContent = JSON.stringify(obj, null, 2);
}, console.error.bind(console));