const COMMON_NAMES = {
  'San Francisco Municipal Transportation Agency': 'Muni',
  'Bay Area Rapid Transit': 'BART',
};

export default function getAgencyNameForDisplay(fullName) {
  return COMMON_NAMES[fullName] || fullName;
}
