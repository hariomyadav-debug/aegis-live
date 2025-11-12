const nodemailer = require("nodemailer")
const { User } = require("../../../models");
const { updateUser } = require("../../service/repository/user.service");
const axios = require("axios");
const fs = require("fs");
const path = require("path"); // Require the Node.js 'fs' module for file system operations

const { getConfig } = require("../repository/Project_conf.service");

// To Genrate OTP
function generateOTP() {
    const otp = Math.floor(1000 + Math.random() * 9000); 
    return otp.toString();
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
let twilioClient = null

async function sendEmailOTP(email, otp) {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
        service: `${process.env.EMAIL_SERVICE}`,
        host: `${process.env.SMTP_HOST}`,//Variable
        port: Number(process.env.EMAIL_PORT), //Variable
        secure: true,
        auth: {
            user: `${process.env.EMAIL}`, //Variable
            pass: `${process.env.PASSWORD}` //Variable
        }
    });
    const LoginLinkTemplate = fs.readFileSync(
        path.resolve(__dirname, "../../../public/emailTemplate.html"),
        "utf-8"
    );
    const settings = await getConfig({ config_id: 1 })
    let emailContent = LoginLinkTemplate.replaceAll(
        "{{app_name}}",
        `${settings.app_name}`
    );
    // emailContent = emailContent.replaceAll(
    //     "{{banner_image}}",
    //     `${settings[0].banner_image}`
    // );
    // emailContent = emailContent.replaceAll(
    //     "{{website_link}}",
    //     `${settings[0].website_link}`
    // );
    // emailContent = emailContent.replaceAll(
    //     "{{apk_link}}",
    //     `${settings[0].android_link}`
    // );
    // emailContent = emailContent.replaceAll(
    //     "{{ios_link}}",
    //     `${settings[0].ios_link}`
    // );
    emailContent = emailContent.replaceAll(
        "{{generatedOtp}}",
        `${otp}`
    );
    emailContent = emailContent.replaceAll(
        "{{baseUrl}}",
        `${process.env.baseUrl}`
    );
    emailContent = emailContent.replaceAll(
        "{{copy_right}}",
        `${settings.copyright_text}`
    );
    // Define email options
    let mailOptions = {
        from: `${process.env.EMAIL}`, //Variable
        to: email,
        subject: `Your OTP for Verification on ${settings.app_name}`,
        html: emailContent // Plain text body
    };

    try {
        // Send email
        let info = await transporter.sendMail(mailOptions);
        if (info) {
            const otpAsInteger = parseInt(otp, 10)

            try {
                // Update the profile with new data
                const otpInDB = await User.update({ otp: otpAsInteger }, { where: { email } });

                if (otpInDB) {
                    return true //Email sent Successfully
                }
                else {
                    return false //Email not sent Successfully
                }

            } catch (error) {
                console.error('Error sending OTP:', error);
                throw error;
            }
        }
        else {
            return false //Email not sent Successfully
        }
    } catch (err) {
        console.error("Error sending email:", err);
        return false; // Error occurred while sending email
    }
}

async function sendTwilioOTP(country_code, mobile_num, otp) {
    // Create a transporter object using SMTP transport
    try {
        // Send email
        if (twilioClient == null) {

            twilioClient = require("twilio")(accountSid, authToken);
        }

        const response = await twilioClient.messages.create({
            body: `Otp from ${process.env.APP_NAME} is ${otp}.`,
            to: `${country_code}${mobile_num}`,
            from: process.env.TWILIO_PHONE_NUMBER,
        })

        if (response.status === "queued" || response.status === "sent" || response.status === "delivered") {
            return true
        } else {
            return false
        }
    } catch (err) {
        console.error("Error sending otp in twilio:", err);
        return false; // Error occurred while sending email
    }
}

async function sendMesg91TP(country_code, mobile_num, otp) {
    // Create a transporter object using SMTP transport
    try {
        // Send email
        const response = await axios.get("https://api.msg91.com/api/v5/otp", {
            params: {
                authkey: process.env.MSG_91_AUTH_KEY,
                template_id: process.env.MSG_91_TEMPLATE_ID, // Template ID from your MSG91 account
                mobile: `91${mobile_num}`,
                // variables: { OTP: generatedOtp },
                otp: otp,
                sender: process.env.MSG91_SENDER_ID,
            },
        });
        if (response.data.type === "success") {
            return true
        } else {
            return false
        }
    } catch (err) {
        console.error("Error sending otp in Message91:", err);
        return false; // Error occurred while sending email
    }
}

// Verify Otp

async function verifyOtp(userpayload, isDemo) {
    try {
        if (userpayload.email && isDemo) {
            const verificationStatus = await User.findOne({
                where: {
                    email: userpayload.email,
                }
            })
            return verificationStatus

        }
        if (userpayload.mobile_num && isDemo) {
            const verificationStatus = await User.findOne({
                where: {
                    mobile_num: userpayload.mobile_num,
                    country_code: userpayload.country_code,
                }
            })
            console.log(verificationStatus, "verificationStatus in otp service");
            
            return verificationStatus

        }
     
        const verificationStatus = await User.findOne({
            where: userpayload
        })

        if (verificationStatus && !isDemo) {
            const user = await updateUser(
                { login_verification_status: true, otp: 0 },
                { user_id: verificationStatus.user_id }
            )
        }
        return verificationStatus
    }
    catch (err) {
        console.error(err)
    }

}

module.exports = { sendEmailOTP, generateOTP, verifyOtp, sendTwilioOTP, sendMesg91TP }