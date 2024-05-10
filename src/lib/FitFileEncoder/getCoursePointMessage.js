import InstructionSigns from '../../lib/InstructionSigns';

export default function getCoursePointMessage(instruction, rMsg) {
  return {
    timestamp: rMsg.timeStamp,
    type: translateInstruction(instruction),
    name: instruction.text,
    position_lat: rMsg.positionLat,
    position_long: rMsg.positionLong,
    distance: rMsg.distance,
  };
}

// Convert BikeHopper instructions to FIT file instructions.
function translateInstruction(instruction) {
  switch (instruction.sign) {
    case InstructionSigns.U_TURN_UNKNOWN:
      return 'u_turn';
    case InstructionSigns.U_TURN_LEFT:
      return 'u_turn';
    case InstructionSigns.KEEP_LEFT:
      return 'slight_left';
    case InstructionSigns.LEAVE_ROUNDABOUT:
      return 'generic';
    case InstructionSigns.TURN_SHARP_LEFT:
      return 'sharp_left';
    case InstructionSigns.TURN_LEFT:
      return 'left';
    case InstructionSigns.TURN_SLIGHT_LEFT:
      return 'slight_left';
    case InstructionSigns.CONTINUE_ON_STREET:
      return 'straight';
    case InstructionSigns.TURN_SLIGHT_RIGHT:
      return 'slight_right';
    case InstructionSigns.TURN_RIGHT:
      return 'right';
    case InstructionSigns.TURN_SHARP_RIGHT:
      return 'sharp_right';
    case InstructionSigns.FINISH:
      return 'generic';
    case InstructionSigns.REACHED_VIA:
      return 'generic';
    case InstructionSigns.USE_ROUNDABOUT:
      return 'generic';
    case InstructionSigns.KEEP_RIGHT:
      return 'slight_right';
    case InstructionSigns.U_TURN_RIGHT:
      return 'u_turn';
    default:
      return 'generic';
  }
}
