// Enum for IO Message Status
function CreateIoMessageEnum () {
    const status = ["Success", "Fail", "Normal"];
    const statusEnum = {};

    for (const val of status) {
        statusEnum[val] = val;
    }

    return Object.freeze(statusEnum);
}

const IoMessageStatus = CreateIoMessageEnum();

class IoMessage {
    constructor() {
        this.status = null;
        this.data = null;
        this.message = null;
    }
}

module.exports = {
    IoMessageStatus,
    IoMessage,
}