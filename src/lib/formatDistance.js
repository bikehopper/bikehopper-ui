// TODO: option to use km, and maybe default to that based on locale?
// note: FormatJS doesn't have anything built in for distance, unlike time.

export default function formatDistance(meters, intl) {
  const feet = meters / 0.3048;
  const miles = feet / 5280;

  if (miles >= 0.1) {
    // Desired precision is
    //   0.1, 0.2, ... 0.9 miles
    //   1, 1.1, 1.2, ... 9.9 miles
    //   10, 11, 12... miles
    // Rationale: no one cares about 1/100th of a mile.
    const milesToDisplay =
      miles >= 10 ? Math.round(miles) : Math.ceil(miles * 10) / 10;

    return intl.formatMessage(
      {
        defaultMessage: '{num}mi',
        description: 'compact version of a distance in miles',
      },
      { num: milesToDisplay },
    );
  }

  return intl.formatMessage(
    {
      defaultMessage: '{num}ft',
      description: 'compact version of a distance in feet',
    },
    { num: Math.round(feet) },
  );
}
