const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

const API_TOKEN = "66e0c33be1c664eb7c232cbbdc71ed69";
const AFFILIATE_MARKER = "713651";

app.use(express.json());

app.get("/flights", async (req, res) => {
  const { origin, days = 3 } = req.query;

  const today = new Date();
  const flightResults = [];

  try {
    for (let i = 0; i < days; i++) {
      const flightDate = new Date(today);
      flightDate.setDate(today.getDate() + i);

      const dd = String(flightDate.getDate()).padStart(2, "0");
      const mm = String(flightDate.getMonth() + 1).padStart(2, "0");
      const yyyy = flightDate.getFullYear();

      const apiUrl = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&currency=eur&token=${API_TOKEN}&depart_date=${yyyy}-${mm}-${dd}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.data) {
        data.data.forEach((flight) => {
          flightResults.push({
            origin: flight.origin,
            destination: flight.destination,
            city: flight.destination_name,
            price: flight.value,
            airline: flight.airline,
            departure: flight.depart_date,
            deep_link: `https://www.aviasales.com/search/${flight.origin}${dd}${mm}${flight.destination}?marker=${AFFILIATE_MARKER}`,
          });
        });
      }
    }

    res.json(flightResults);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch flights", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
