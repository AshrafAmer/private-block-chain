const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
		this.body = Buffer(JSON.stringify(data)).toString('hex');   // Will contain the transactions stored in the block, by default it will encode the data
		this.time = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                              // Reference to the previous Block Hash
    }
    
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            // Save in auxiliary variable the current block hash
            const current_hash = self.hash;
            // Recalculate the hash of the Block
            this.hash = null;
            const recalculated_hash = SHA256(JSON.stringify(this)).toString();
            // Reassigned hash with the original hash value
            this.hash = current_hash;
            // Comparing if the hashes changed
            resolve(current_hash === recalculated_hash)
        });
    }

    getBData() {
        let self = this;
        return new Promise((resolve, reject)=>{
            // Resolve with the data if the object isn't the Genesis block
            if(self.previousBlockHash === null){
                reject(Error('This is a Genesis Block'));
            }
            // Getting the encoded data saved in the Block
            // Decoding the data to retrieve the JSON representation of the object
            // Parse the data to an object to be retrieve.
            resolve(JSON.parse(hex2ascii(this.body)));
        });

    }

}

module.exports.Block = Block;
