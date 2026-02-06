const { redis } = require("../../helper/redis");


async function hsetRedis(key, payload, ttl=6*60*60) {
    try {
        await redis.hset(key, payload);

        ttl && await redis.expire(key, ttl); // safety TTL
        return;

    } catch (error) {
        console.log("'Redis key not hset Error: ", error)
        const err = new Error(`Redis key not hset for key: ${key}`);
        err.cause = error; // Node 16+
        throw err;

    }
}

async function setRedis(key, value, seconds) {
    try {
        return await redis.set(key, value, "NX", "EX", seconds);

    } catch (error) {
        console.log("'Redis key not set Error: ", error)
        const err = new Error(`Redis key not set for key: ${key}`);
        err.cause = error; // Node 16+
        throw err;
    }
}


async function hgetRedis(key) {
    try {
        return await redis.hgetall(key);

    } catch (error) {
        console.log("'Redis key not get Error: ", error)
        const err = new Error(`Redis key not get for key: ${key}`);
        err.cause = error; // Node 16+
        throw err;

    }
}

async function deleteRedis(key) {
    try {
        return await redis.del(key);

    } catch (error) {
        console.log("'Redis key not get Error: ", error)
        const err = new Error(`Redis key not get for key: ${key}`);
        err.cause = error; // Node 16+
        throw err;

    }
}



module.exports = { hsetRedis, hgetRedis, setRedis, deleteRedis }