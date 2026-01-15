
const { Op, fn, col, literal } = require("sequelize");
const { User, Coin_to_coin, Follow } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");


const dummy_data = [
  {
    id: 1,
    image_name: "ludo",
    image_url: "https://media.istockphoto.com/id/493120080/vector/vector-ludo-game-board.jpg?s=612x612&w=0&k=20&c=XoQU_WmnbaSzCbFWJxMlb6us9OLivfotc4aTIcP5M1E="
  },
  {
    id: 2,
    image_name: "teen_patti",
    image_url: "https://artofcards.in/media/magefan_blog/3-patti-sequence-rules-1.png"
  },
  {
    id: 3,
    image_name: "snake_ladder",
    image_url: "https://play-lh.googleusercontent.com/k7L72U1Tvn7Pw4EfYr79DBU5nVooEPP1gLT9T6PhoHEmyspnHJsy_G0ybSCeT1ETqczaUIa6tLmcwLd9lyUMOA"
  },
  {
    id: 4,
    image_name: "rummy",
    image_url: "https://spiele-palast.de/app/uploads/sites/15/2024/11/EN_rummy_lesson_6.3_1444x812-1110x626.jpg"
  }
];

async function getGameLists(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Gaming list fetched successfully",
      data: dummy_data
    });
  } catch (error) {
    console.error("Gaming API error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

module.exports = { getGameLists };
