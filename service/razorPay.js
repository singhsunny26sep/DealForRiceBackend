const crypto = require('crypto');

// const secret = process.env.RAZOR_SECRET_KEY

exports.verifySignature = (orderId, paymentId, signature, secret) => {
    // console.log("orderId: ", orderId);
    // console.log("orderId: ", paymentId);
    // console.log("orderId: ", signature);
    // console.log("orderId: ", secret);
    const dataString = `${orderId}|${paymentId}`;
    const generatedSignature = crypto.createHmac('sha256', secret).update(dataString).digest('hex');
    // console.log("signature: ", signature);
    // console.log("generatedSignature: ", generatedSignature);
    return generatedSignature === signature;
}