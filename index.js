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

      const ddToday = String(flightDate.getDate()).padStart(2, "0");
      const mmToday = String(flightDate.getMonth() + 1).padStart(2, "0");
      const yyyyToday = flightDate.getFullYear();

      const apiUrl = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&currency=eur&token=${API_TOKEN}&depart_date=${yyyyToday}-${mmToday}-${ddToday}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.data) {
        const uniqueFlights = {};

        data.data.forEach((flight) => {
          // Ignore si pas de date
          if (!flight.depart_date) return;

          const key = `${flight.origin}-${flight.destination}-${flight.depart_date}`;

          // Garder le vol le moins cher
          if (!uniqueFlights[key] || flight.value < uniqueFlights[key].price) {
            const departDate = new Date(flight.depart_date);
            if (isNaN(departDate)) return; // ignore si date invalide

            const dd = String(departDate.getDate()).padStart(2, "0");
            const mm = String(departDate.getMonth() + 1).padStart(2, "0");

            uniqueFlights[key] = {
              origin: flight.origin,
              destination: flight.destination,
              city: flight.destination_name || "Unknown",
              price: flight.value || 0, // fallback si pas de prix
              airline: flight.airline || "Unknown",
              departure: flight.depart_date,
              deep_link: `https://www.aviasales.com/search/${flight.origin}${dd}${mm}${flight.destination}?marker=${AFFILIATE_MARKER}`,
            };
          }
        });

        flightResults.push(...Object.values(uniqueFlights));
      }
    }

    res.json(flightResults);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch flights", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
