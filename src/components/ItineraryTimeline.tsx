// A timeline consists of a series of <ItineraryRow>s.
// No styles needed currently.

export default function ItineraryBase({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
