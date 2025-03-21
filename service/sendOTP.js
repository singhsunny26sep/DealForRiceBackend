require("dotenv").config()
const APIKEY = process.env.api_key_2Factor
// const TwoFactor = new (require('2factor'))(process.env.api_key_2Factor)
const TwoFactor = new (require('2factor'))(APIKEY)
var axios = require('axios');


exports.sendOTP = async (mobile) => {
    // TwoFactor.sendOTP(`+91${mobile}`, { otp: "1234", template: "riceDealOTP" }).then((sessionId) => {
    TwoFactor.sendOTP(mobile, { otp: "1234", template: "riceDealOTP" }).then((sessionId) => {
        console.log("sessionId: ", sessionId)
        return sessionId
    }, (error) => {
        console.log("error: ", error)
    })
}


exports.verifyOTP = async (sessionId, otp) => {
    TwoFactor.verifyOTP(sessionId, otp).then((response) => {
        console.log("response: ", response)
    }, (error) => {
        console.log("error: ", error)
    })
}


/* exports.urlSendTestOtp = async (mobile) => {
    var config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://2factor.in/API/V1/${APIKEY}/SMS/+91${mobile}/AUTOGEN/OTP1`,
        headers: {}
    };
    axios(config).then(function (response) {
        console.log("response: ", JSON.stringify(response.data));
        return JSON.stringify(response.data)
    }).catch(function (error) {
        console.log("error: ", error);
    });
} */

exports.urlSendTestOtp = async (mobile) => {
    try {
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://2factor.in/API/V1/${APIKEY}/SMS/+91${mobile}/AUTOGEN/OTP1`,
            headers: {}
        };

        const response = await axios(config);
        // console.log("response: ", response.data);
        return response.data; // Return actual response data
    } catch (error) {
        console.log("error: ", error);
        throw error; // Ensure the error is propagated
    }
};


/* exports.urlVerifyOtp = async (sessionId, otp) => {
    var config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://2factor.in/API/V1/${APIKEY}/SMS/VERIFY/${sessionId}/${otp}`,
        headers: {}
    };

    axios(config).then(function async(response) {
        console.log("Respones: ", JSON.stringify(response.data));
        return JSON.stringify(response.data)
    }).catch(function (error) {
        console.log("error: ", error);
        throw error; // Ensure the error is propagated
    });
} */

exports.urlVerifyOtp = async (sessionId, otp) => {
    try {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://2factor.in/API/V1/${APIKEY}/SMS/VERIFY/${sessionId}/${otp}`,
            headers: {}
        };

        const response = await axios(config);
        // console.log("Response: ", response.data);
        return response.data; // Return the actual data
    } catch (error) {
        console.log("Error: ", error.message);
        throw error; // Ensure the error is propagated
    }
};
