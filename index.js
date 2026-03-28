const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = "66e0c33be1c664eb7c232cbbdc71ed69";
const AFFILIATE_MARKER = "713651";

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/flights", async (req, res) => {
  const { origin = "ROM", days = 7 } = req.query;
  const today = new Date();
  const flightResults = [];

  try {
    for (let i = 0; i < parseInt(days); i++) {
      const flightDate = new Date(today);
      flightDate.setDate(today.getDate() + i);

      const yyyy = flightDate.getFullYear();
      const mm = String(flightDate.getMonth() + 1).padStart(2, "0");
      const dd = String(flightDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const apiUrl = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&departure_at=${dateStr}&one_way=true&currency=eur&sorting=price&limit=10&token=${API_TOKEN}`;

      console.log(`Fetching: ${apiUrl}`);

      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log(`Response for ${dateStr}:`, JSON.stringify(data).slice(0, 300));

      const flights = Array.isArray(data.data) ? data.data : [];

      const uniqueFlights = {};
      flights.forEach((flight) => {
        if (!flight.departure_at) return;

        const departDate = new Date(flight.departure_at);
        if (isNaN(departDate)) return;

        const depDd = String(departDate.getDate()).padStart(2, "0");
        const depMm = String(departDate.getMonth() + 1).padStart(2, "0");

        const originAirport = flight.origin_airport || flight.origin;
        const destAirport = flight.destination_airport || flight.destination;

        const key = `${originAirport}-${destAirport}-${flight.departure_at}`;

        if (!uniqueFlights[key] || flight.price < uniqueFlights[key].price) {
          uniqueFlights[key] = {
            origin: originAirport,
            destination: destAirport,
            price: flight.price || 0,
            airline: flight.airline || "Unknown",
            departure: flight.departure_at,
            duration: flight.duration_to || flight.duration || null,
            transfers: flight.transfers ?? 0,
            deep_link: `https://www.aviasales.com/search/${originAirport}${depDd}${depMm}${destAirport}1?marker=${AFFILIATE_MARKER}`,
          };
        }
      });

      flightResults.push(...Object.values(uniqueFlights));
    }

    console.log(`Total flights found: ${flightResults.length}`);
    res.json(flightResults);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Could not fetch flights", details: error.message });
  }
});

app.get("/", (req, res) => res.send("Backend is running ✅"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
