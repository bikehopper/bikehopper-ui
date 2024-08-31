declare module 'parse-coords' {
  export default function parseCoords(coordString: string):
    {lat: number, lng: number} | null;
}
