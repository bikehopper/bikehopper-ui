export default function formatMajorStreets(leg) {
  var distanceByStreetName = {};
  leg.instructions.forEach((instruction) => {
    if (!instruction.street_name) {
      return;
    }

    const streetName = instruction.street_name;
    distanceByStreetName[streetName] = distanceByStreetName[streetName] || 0;
    distanceByStreetName[streetName] += instruction.distance;
  });

  var streetsWithDistance = Object.keys(distanceByStreetName).map(
    (streetName) => {
      return {
        name: streetName,
        totalDistance: distanceByStreetName[streetName],
      };
    },
  );

  if (streetsWithDistance.length < 1) {
    return;
  }

  var quartileDistance = quartileStreets(streetsWithDistance, 0.85);

  var streetsOverQuartile = streetsWithDistance.filter((street) => {
    return street.totalDistance >= quartileDistance;
  });

  return streetsOverQuartile.map((s) => s.name);
}

function quartileStreets(streets, q) {
  streets = streets.concat([]);
  streets.sort((a, b) => {
    return a.totalDistance - b.totalDistance;
  });

  var pos = (streets.length - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;

  if (streets[base + 1] !== undefined) {
    return (
      streets[base].totalDistance +
      rest * (streets[base + 1].totalDistance - streets[base].totalDistance)
    );
  } else {
    return streets[base].totalDistance;
  }
}
