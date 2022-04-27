const COMMON_NAMES = {
  'AC TRANSIT': 'AC Transit',
  'Bay Area Rapid Transit': 'BART',
  'San Francisco Municipal Transportation Agency': 'Muni',
};

export default function getAgencyNameForDisplay(fullName) {
  return COMMON_NAMES[fullName] || fullName;
}
