// Initialize Socket.IO client
const socket = io();

// Check if browser supports Geolocation API
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

// Initialize the Leaflet map and set its initial view
const map = L.map("map").setView([0, 0], 2);

// Add the OpenStreetMap tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Object to store markers for each user
const markers = {};

// Listen for 'receive-location' from the server
socket.on("receive-location", (data) => {
    const { id, name, color, latitude, longitude } = data; // Get new name and color data
    const latLng = [latitude, longitude];

    // --- NEW: Create a custom colored marker icon ---
    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M15 0C6.716 0 0 6.636 0 14.82c0 8.184 15 27.18 15 27.18s15-18.996 15-27.18C30 6.636 23.284 0 15 0z" fill="${color}"/>
                   <circle cx="15" cy="15" r="7" fill="white"/>
               </svg>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42] // Point of the icon which will correspond to marker's location
    });

    if (!markers[id]) {
        // --- UPDATED: Create marker with custom icon and add a permanent tooltip for the name ---
        markers[id] = L.marker(latLng, { icon: customIcon })
            .addTo(map)
            .bindTooltip(name, {
                permanent: true, // Make the label always visible
                direction: 'bottom', // Position the label below the marker
                offset: L.point(0, 1) // Adjust offset
            });
    } else {
        markers[id].setLatLng(latLng);
    }
    
    // Auto-zoom logic
    const activeMarkers = Object.values(markers);
    if (activeMarkers.length > 1) {
        const bounds = L.latLngBounds(activeMarkers.map(marker => marker.getLatLng()));
        map.fitBounds(bounds, { padding: [50, 50] });
    } else if (activeMarkers.length === 1) {
        map.setView(activeMarkers[0].getLatLng(), 16);
    }
});

// Listen for 'user-disconnected' event
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});