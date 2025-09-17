const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "syedafroz306@gmail.com", //"devrathod96445@gmail.com",
    pass: "jbem xzyr lpzl hglj", //"fhhn ebed dspi vajq",
  },
});

exports.sendEmailOtp = (email, otp) => {
  let mailOptions = {
    from: "syedafroz306@gmail.com", // "devrathod96445@gmail.com",
    to: email,
    subject: "Hello from DealOfRice",
    text: `${otp} your verification code`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error:", error);
    }
    console.log("Email sent:", info.response);
  });
};
