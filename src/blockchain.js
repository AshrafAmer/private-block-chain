const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
           try{
                block.height = self.chain.length;
                block.time = new Date().getTime().toString().slice(0,-3);
                if(self.height > -1)
                    block.previousblockhash = self.chain[self.height].hash;
                
                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);
                self.height++;
                resolve(block);
            }catch(error){
                reject(Error('ERROR::' + error));
            }
        });
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            // 1.Get the time from the message sent as a parameter
            let time = parseInt(message.split(':')[1]);
            // 2.Get the current time
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            // 3.Check if the time elapsed is less than 5 minutes (compare the time in the message and currentTime)
            if(time - currentTime > 300)
                reject(Error('Time Out'));
            
            bitcoinMessage.verify(message, address, signature);
            const block = new BlockClass.Block({star: star, owner: address });
            const block_added = await self._addBlock(block);

            resolve(block_added);
        });
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(b => b.hash === hash)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach(async(b) => {
                let decodedData = await b.getBData();
                if (decodedData.owner === address) stars.push(decodedData);
            });

            resolve(stars);
        });
    }

    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.chain.forEach(async(_block) => {
                if(!(await _block.validate())){
                    errorLog.push({
                        err: 'ERROR:: Not Valid',
                        block: _block
                    });
                }

                // block.height === blockchain length [start from zero]
                // ==> block index: block.height - 1 && previousblock index: block.height - 2
                if( _block.height - 2 > 0 && _block.previousblockhash !== self.chain[_block.height - 2]){
                    errorLog.push({
                        err: 'ERROR:: Chain is broken',
                        block: _block
                    });
                }
            });

            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;   