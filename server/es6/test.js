var oneBcClient = require('@onenetwork/one-backchain-client');

/**
* Instantiate the backchain client,
* providing real values for url, contractAddress and privateKey
*/
var bc = oneBcClient({ 
 blockchain: 'eth', 
 url: 'http://192.168.201.55:8545', 
 contractAddress: "0xc5d4b021858a17828532e484b915149af5e1b138",
 privateKey: "0x8ad0132f808d0830c533d7673cd689b7fde2d349ff0610e5c04ceb9d6efb4eb1"
});

/**
* Invoke the hashCount API to return the total number of hashes stored
* on the Backchain
*/
bc.hashCount().then(function(hashCount) {
 console.info("Backchain hashCount : " + hashCount);
});


/**
* Invoke the verify function to see if a particular hash value
* is stored on the Backchain.
*/
var sampleHash = '0xd563910ef45d9f7c8d370c8fe159bda96b38b099f4745a0f61b142a762825e9b'; // change this to whatever hashed from our app in order to insert into eth db
bc.post(sampleHash).then(function() {    // this is used to insert the hashvalue in eth db  
   bc.verify(sampleHash).then(function(verified) {
   console.info(sampleHash + " is on the Backchain? " + verified);
 });
});