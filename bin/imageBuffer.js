module.exports = {
    arrayBufferToBase64: function (buffer) {
        /*
        * This function will be used to help with the conversion of the
        * source of the profile picture of the user
        * */

        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach(b => binary += String.fromCharCode(b));
        return Buffer.from(binary, 'binary').toString('base64');
    }
    ,
    base64ToImageSrc: function (imageInfos){
        /*
       * In this function, the update information of the user
       * will be display in the front-end.
       * */

        let name = imageInfos.name;
        let type = imageInfos.contentType;
        let data = imageInfos.data;

        let source = module.exports.arrayBufferToBase64(data.buffer);
        source = 'data:' + type + ';base64,' + source;

        return source;
    }
}

