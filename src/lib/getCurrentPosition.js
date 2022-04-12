// A promise-ified version of navigator.geolocation.getCurrentPosition

export default function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
