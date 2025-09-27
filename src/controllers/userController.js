exports.getUsers = (req, res) => {
  res.json([
    { id: 1, name: "Yoeurn Yan" },
    { id: 2, name: "Phan sovanarith" },
    { id: 3, name: "Ran Fidynan" },
    { id: 4, name: "Ra Phearom" },
    { id: 5, name: "Yang Sokheang" },
  ]);
};
