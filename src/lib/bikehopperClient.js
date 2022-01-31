class BikeHopperClient {
  async getRoute(options) {
    console.debug('BikeHopperClient.getRoute...');

    const profile = options.profile || 'bike2';
    const optimize = options.optimize || false;
    const pointsEncoded = options.pointsEncoded || false;
    const route = await fetch(`${process.env.REACT_APP_BIKEHOPPER_DOMAIN}/v1/route?point=${options.points[0]}&point=${options.points[1]}&profile=${profile}&optimize=${optimize}&points_encoded=${pointsEncoded}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: options.signal
    })
    .then(res => res.json());

    return route;
  }
}

export {BikeHopperClient};
