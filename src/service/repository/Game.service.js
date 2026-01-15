const {Game_transaction} = require("../../../models");


async function insertGameTransaction(payload) {
    try {
        const newHistory = await Game_transaction.create(payload);
        return newHistory;
    } catch (error) {
        console.error('Error in Game transaction:', error);
        throw error;
    }
}


module.exports = {
    insertGameTransaction
}