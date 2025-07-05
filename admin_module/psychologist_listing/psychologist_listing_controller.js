const Psychologist = require("../psychologist_adding/psychologist_adding_model");

exports.getAllPsychologists = async (req, res) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const psychologists = await Psychologist.find();

    const result = psychologists.map((p) => ({
      ...p._doc,
      image: `${baseUrl}/uploads/psychologist/${p.image}`,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching psychologists:", err);
    res.status(500).json({ message: "Error fetching data" });
  }
};