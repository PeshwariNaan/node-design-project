/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken = `pk.eyJ1IjoicGVzaHdhcmluYWFuIiwiYSI6ImNsZHltc3hzMTBlbWczdW53d2MydXN0a2cifQ.fi--XA37Ab73fzBEZb7g8Q`;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/peshwarinaan/cldyq4yrh007r01plcrldnsq6',
    scrollZoom: false,
    //   center: [-118.184759, 33.782588],
    //   zoom: 7,
    //interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
