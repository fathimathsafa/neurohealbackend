// services/user.service.js
const UserModel = require('../model/user.model');

class UserService {
  static async registerUser(fullName, email, phone, password) {
    try {
      const createUser = new UserModel({ fullName, email, phone, password, loginMethod: 'password' });
      return await createUser.save();
    } catch (err) {
      throw err;
    }
  }

  static async loginUser(email) {
    try {
      return await UserModel.findOne({ email });
    } catch (err) {
      throw err;
    }
  }

  static async generateOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = new UserModel({ email });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.loginMethod = 'password';
    await user.save();

    return otp;
  }

 static async verifyOtp(email, otp) {
  try {
    const user = await UserModel.findOne({ email });
    if (
      user &&
      user.otp === otp &&
      user.otpExpires &&
      user.otpExpires > new Date()
    ) {
      return user;
    }
    return null;
  } catch (err) {
    throw err;
  }
}

}

module.exports = UserService;
