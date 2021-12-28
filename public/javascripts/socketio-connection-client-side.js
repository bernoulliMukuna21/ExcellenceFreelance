let dev_URL = 'http://localhost:3000';
let prod_URL = 'https://excellence-freelance.herokuapp.com/'
var socket = io.connect(dev_URL);

export{socket, dev_URL, prod_URL}

