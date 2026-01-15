
const { Op, fn, col, literal } = require("sequelize");
const { User, Coin_to_coin, Follow } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");
const { getUser, updateUser } = require("../../service/repository/user.service");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const { insertGameTransaction } = require("../../service/repository/Game.service");
const { default: axios } = require("axios");

async function getGameLists(req, res) {
  const app_id = "dBRapwZOY77z87RMsNYYbtJzkYhARDKw";
  try {
    const response = await axios.post(
      "https://gmapi.nextdynamicx.com/get_game_list.php",
      {
        app_id: app_id
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );



    return generalResponse(
      res,
      {
        records: response.data.games,
        app_id,
        count: response.data.games.length
      },
      "Gaming list fetched successfully",
      true
    );
  } catch (error) {
    return generalResponse(
      res,
      {},
      "Something went wrong",
      false,
      true,
      500
    );
  }
}



async function getuserDetailsForGame(req, res) {
  const { ss_token } = req.body;

  if (!ss_token) {
    return res.status(400).json({
      success: true,
      code: 1,
      message: "Token is required!",
    });
  }

  try {
    const authData = jwt.verify(
      ss_token, // auth token
      process.env.screteKey
    );

    const userDetails = await getUser({ user_id: authData.user_id });
    if (!userDetails) {
      return res.status(400).json({
        success: true,
        code: 1,
        message: "Invalid token!",
        
      });
    }

    return res.status(200).json({
      success: true,
      code: 0,
      message: "Success",
      data: {
        user_id: `${userDetails.user_id}`,
        user_name: userDetails.user_name,
        user_avatar: userDetails.profile_pic,
        balance: Number(userDetails.available_coins)
      }
    });


  } catch (error) {
    console.error('Error game token validation: ', error);
    return res.status(500).json({
      success: false,
      code: 1,
      message: error.message || String(error),
    });
  }
}

async function gameTransaction(req, res) {
  const {
    app_id,
    ss_token,
    userid,
    client_ip,
    currency_diff,
    game_id,
    game_round_id,
    order_id,
    diff_msg,
    timestamp
  } = req.body;

  if (!app_id || !userid || !order_id || !ss_token) {
    return res.status(400).json({
      code: 1,
      message: "Invalid request data"
    });
  }

  try {
    const authData = jwt.verify(
      ss_token, // auth token
      process.env.screteKey
    );


    const userDetails = await getUser({ user_id: authData.user_id });
    if (!userDetails) {
      return res.status(400).json({
        code: 1,
        message: "User not found!"
      });
    }

    const currentBalance = Number(userDetails.available_coins);
    const updatedBalance = currentBalance + Number(currency_diff);
    if (updatedBalance < 0) {
      return res.status(400).json({
        code: 1,
        message: "Insufficient balance!"
      });
    }

    const payload = {
      app_id,
      user_id: Number(authData.user_id),
      client_ip: client_ip || req.ip,
      currency_diff: Number(currency_diff),
      game_id: Number(game_id),
      game_round_id,
      order_id,
      diff_msg,
      timestamp: Number(timestamp),
      status: 1
    };
    console.log(currentBalance);
    const update = await updateUser({ available_coins: updatedBalance }, { user_id: authData.user_id });
    console.log(update, '-------------d--------');
    if (!update && !(update[0] > 0)) {
      return res.status(400).json({
        code: 1,
        message: "Failed update!"
      });
    }
    await insertGameTransaction(payload);

    return res.status(200).json({
      code: 0,
      message: "success",
      data: {
        currency_balance: updatedBalance
      }
    });


  } catch (error) {
    console.log('Error game token validation: ', error);
    return res.status(500).json({
      code: 1,
      message: "Internal server error"
    });
  }
}




module.exports = { getGameLists, getuserDetailsForGame, gameTransaction };
