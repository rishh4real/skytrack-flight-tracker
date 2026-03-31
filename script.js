const API_KEY = "555072cb2483e06f4f6fca89c0a9b0e8";

let allFlights = [];

// FETCH DATA
fetch(`https://api.aviationstack.com/v1/flights?access_key=${API_KEY}`)
  .then(res => res.json())
  .then(data => {
    allFlights = data.data;
    displayFlights(allFlights);
  })
  .catch(err => {
    console.log("Error:", err);
  });


// DISPLAY FUNCTION
function displayFlights(flights) {
  const container = document.getElementById("flightsContainer");
  container.innerHTML = "";

  flights.slice(0, 10).forEach(flight => {
    const card = document.createElement("div");
    card.classList.add("flight-card");

    card.innerHTML = `
      <h3>${flight.airline.name || "Unknown Airline"}</h3>
      <p>
        ${flight.departure.airport || "Unknown"} 
        → 
        ${flight.arrival.airport || "Unknown"}
      </p>
      <span class="status">${flight.flight_status}</span>
    `;

    container.appendChild(card);
  });
}


// SEARCH FUNCTION
document.getElementById("searchBtn").addEventListener("click", () => {
  const searchValue = document.getElementById("search").value.toLowerCase();

  const filtered = allFlights.filter(flight => {
    return (
      (flight.airline.name && flight.airline.name.toLowerCase().includes(searchValue)) ||
      (flight.departure.airport && flight.departure.airport.toLowerCase().includes(searchValue)) ||
      (flight.arrival.airport && flight.arrival.airport.toLowerCase().includes(searchValue))
    );
  });

  displayFlights(filtered);
});