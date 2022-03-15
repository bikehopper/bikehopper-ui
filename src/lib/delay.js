export default function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
