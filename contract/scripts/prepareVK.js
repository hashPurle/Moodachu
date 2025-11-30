const fs = require("fs");
const path = require("path");

function decStrToHex(num) {
    return '0x' + BigInt(num).toString(16);
}

function loadCompactVK() {
    const vkPath = path.join(__dirname, "..", "keys", "verification_key.json");
    const vk = JSON.parse(fs.readFileSync(vkPath, "utf8"));

    const compactVK = {
        alpha_g1_x: decStrToHex(vk.vk_alpha_1[0]),
        alpha_g1_y: decStrToHex(vk.vk_alpha_1[1]),

        beta_g2_x_0: decStrToHex(vk.vk_beta_2[0][0]),
        beta_g2_x_1: decStrToHex(vk.vk_beta_2[0][1]),
        beta_g2_y_0: decStrToHex(vk.vk_beta_2[1][0]),
        beta_g2_y_1: decStrToHex(vk.vk_beta_2[1][1]),

        ic_length: vk.IC.length // For your VK this is 2
    };

    return compactVK;
}

module.exports = { loadCompactVK };
