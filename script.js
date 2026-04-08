const API_KEY = "555072cb2483e06f4f6fca89c0a9b0e8";
const REFRESH_INTERVAL_MS = 60000;
let allFlights = [];
let filteredFlights = [];

const container = document.getElementById("flightsContainer");
const loader = document.getElementById("loader");
const emptyState = document.getElementById("emptyState");
const errorContainer = document.getElementById("errorContainer");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const regionFilter = document.getElementById("regionFilter");
const lastUpdated = document.getElementById("lastUpdated");
let map;
let markerLayer;

function init() {
  initMap();
  fetchData();
  setInterval(fetchData, REFRESH_INTERVAL_MS);
  
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  regionFilter.addEventListener("change", handleSearch);
}

function initMap() {
  map = L.map("flightMap", { zoomControl: true }).setView([22, 15], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function fetchData() {
  showLoader();
  fetch(`https://api.aviationstack.com/v1/flights?access_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error.message || "Failed to fetch from API");
      }
      allFlights = data.data || [];
      handleSearch();
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    })
    .catch(err => {
      console.error("Error:", err);
      showError("Failed to fetch live flight data. The API may have reached its limit.");
    });
}

function displayFlights(flights) {
  hideLoader();
  container.innerHTML = "";
  errorContainer.style.display = "none";
  
  if (!flights || flights.length === 0) {
    emptyState.style.display = "block";
    renderMap([]);
    return;
  }
  
  emptyState.style.display = "none";
  renderMap(flights);

  flights.slice(0, 12).forEach((flight) => {
    const card = document.createElement("div");
    card.classList.add("flight-card", "glass-panel");

    // Format Data
    const airlineName = flight.airline?.name || "Unknown Airline";
    const flightIata = flight.flight?.iata || flight.flight?.icao || "N/A";
    
    const depIata = flight.departure?.iata || "???";
    const depName = flight.departure?.airport || "Unknown Departure";
    
    const arrIata = flight.arrival?.iata || "???";
    const arrName = flight.arrival?.airport || "Unknown Arrival";
    
    const status = flight.flight_status || "unknown";
    
    // Status color mapping
    let statusClass = "status-unknown";
    if (status === "active") statusClass = "status-active";
    if (status === "scheduled") statusClass = "status-scheduled";
    if (status === "cancelled") statusClass = "status-cancelled";
    if (status === "landed") statusClass = "status-landed";

    card.innerHTML = `
      <div class="card-header">
        <div class="airline-name">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-accent"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.3 2.6c-.1.3-.1.7.2.9l6.5 3.5-3.1 3.1-4.3-.9c-.2-.1-.5 0-.7.2l-1.6 1.6c-.2.2-.2.6 0 .8l5.2 2 2 5.2c.2.3.6.3.8 0l1.6-1.6c.2-.2.3-.5.2-.7l-.9-4.3 3.1-3.1 3.5 6.5c.2.3.6.3.9.2l2.6-1.3c.3-.2.6-.6.5-1z"></path></svg>
          ${airlineName}
        </div>
        <span class="flight-code">${flightIata}</span>
      </div>
      
      <div class="route">
        <div class="airport">
          <h4>${depIata}</h4>
          <p title="${depName}">${depName}</p>
        </div>
        
        <div class="flight-path">
          <div class="path-line"></div>
          <svg class="plane-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"></path></svg>
        </div>
        
        <div class="airport">
          <h4>${arrIata}</h4>
          <p title="${arrName}">${arrName}</p>
        </div>
      </div>
      
      <span class="status-badge ${statusClass}">${status}</span>
    `;

    container.appendChild(card);
  });
}

function handleSearch() {
  const searchValue = searchInput.value.toLowerCase().trim();
  const selectedRegion = regionFilter.value;
  
  filteredFlights = allFlights.filter(flight => {
    const matchesSearch =
      !searchValue ||
      (flight.airline?.name && flight.airline.name.toLowerCase().includes(searchValue)) ||
      (flight.departure?.airport && flight.departure.airport.toLowerCase().includes(searchValue)) ||
      (flight.arrival?.airport && flight.arrival.airport.toLowerCase().includes(searchValue)) ||
      (flight.flight?.iata && flight.flight.iata.toLowerCase().includes(searchValue)) ||
      (flight.departure?.iata && flight.departure.iata.toLowerCase().includes(searchValue)) ||
      (flight.arrival?.iata && flight.arrival.iata.toLowerCase().includes(searchValue));

    const matchesRegion = inRegion(flight.live?.latitude, flight.live?.longitude, selectedRegion);
    return matchesSearch && matchesRegion;
  });

  displayFlights(filteredFlights);
}

function showLoader() {
  loader.style.display = "flex";
  container.innerHTML = "";
  emptyState.style.display = "none";
  errorContainer.style.display = "none";
}

function hideLoader() {
  loader.style.display = "none";
}

function showError(msg) {
  hideLoader();
  errorContainer.textContent = msg;
  errorContainer.style.display = "block";
  renderMap([]);
}

function inRegion(lat, lon, region) {
  if (region === "all") return true;
  if (typeof lat !== "number" || typeof lon !== "number") return false;

  const regions = {
    "north-america": { minLat: 7, maxLat: 83, minLon: -168, maxLon: -52 },
    europe: { minLat: 35, maxLat: 72, minLon: -12, maxLon: 40 },
    asia: { minLat: -10, maxLat: 80, minLon: 25, maxLon: 180 }
  };

  const bounds = regions[region];
  if (!bounds) return true;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}

function renderMap(flights) {
  if (!markerLayer || !map) return;
  markerLayer.clearLayers();
  const points = [];

  flights.slice(0, 180).forEach(flight => {
    const lat = flight.live?.latitude;
    const lon = flight.live?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") return;
    points.push([lat, lon]);

    const heading = flight.live?.direction || 0;
    const icon = L.divIcon({
      className: "plane-marker-wrap",
      html: `<svg class="plane-marker" style="transform: rotate(${heading}deg);" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const airline = flight.airline?.name || "Unknown Airline";
    const code = flight.flight?.iata || flight.flight?.icao || "N/A";
    const dep = flight.departure?.iata || "N/A";
    const arr = flight.arrival?.iata || "N/A";
    const marker = L.marker([lat, lon], { icon }).bindPopup(
      `<strong>${airline}</strong><br>Flight: ${code}<br>${dep} → ${arr}`
    );
    markerLayer.addLayer(marker);
  });

  if (points.length > 0) {
    map.fitBounds(points, { padding: [20, 20], maxZoom: 6 });
  } else {
    map.setView([22, 15], 2);
  }
}

// Start application
document.addEventListener("DOMContentLoaded", init);