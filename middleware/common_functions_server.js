const bcrypt = require("bcrypt");


async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    return hash
}

async function comparehashPassword(password, password2) { // updated
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const isSame = await bcrypt.compare(password2, hash) // updated
    return isSame // updated
    
}

module.exports = {
    hashPassword,comparehashPassword
}
