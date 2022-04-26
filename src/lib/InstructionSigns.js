// The meaning of the "sign" field in GraphHopper's returned instructions.
const InstructionSigns = {
  UNKNOWN: -99,
  U_TURN_UNKNOWN: -98,
  U_TURN_LEFT: -8,
  KEEP_LEFT: -7,
  LEAVE_ROUNDABOUT: -6,
  TURN_SHARP_LEFT: -3,
  TURN_LEFT: -2,
  TURN_SLIGHT_LEFT: -1,
  CONTINUE_ON_STREET: 0,
  TURN_SLIGHT_RIGHT: 1,
  TURN_RIGHT: 2,
  TURN_SHARP_RIGHT: 3,
  FINISH: 4,
  REACHED_VIA: 5,
  USE_ROUNDABOUT: 6,
  KEEP_RIGHT: 7,
  U_TURN_RIGHT: 8,
  PT_START_TRIP: 101,
  PT_TRANSFER: 102,
  PT_END_TRIP: 103,
};

export default InstructionSigns;
