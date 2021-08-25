var input = document.createElement('input');
input.type = 'file';
input.onchange = function() {
    window.stream = new Stream(new FileSource(input.files[0]));
};
input.click();

