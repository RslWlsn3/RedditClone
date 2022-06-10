var nodemailer = require("nodemailer");
import { gmailPswrd } from "../config";

export async function sendEmail(to: string, html: string) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "connor27mote@gmail.com",
      pass: gmailPswrd,
    },
  });

  var mailOptions = {
    from: "connor27mote@gmail.com",
    to: to,
    subject: "Change password",
    html,
  };

  transporter.sendMail(mailOptions, function (error: string, info: any) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
