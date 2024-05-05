export default class CoursePointMessage {
  constructor(instruction, rMsg) {
    this.instruction = instruction;
    this.rMsg = rMsg;
  }

  getMessage() {
    return {
      timestamp: this.rMsg.timeStamp,
      type: this.getName(this.instruction),
      // TODO: name does not seem to work...
      name: this.instruction.text,
      position_lat: this.rMsg.positionLat,
      position_long: this.rMsg.positionLong,
      distance: this.rMsg.distance,
    };
  }

  // Translate instruction from bikehopper to fit format.
  getName(instruction) {
    switch (instruction.sign) {
      case -98:
        return 'u_turn';
      case -8:
        return 'u_turn';
      case -7:
        return 'slight_left';
      case -6:
        return 'generic';
      case -3:
        return 'sharp_left';
      case -2:
        return 'left';
      case -1:
        return 'slight_left';
      case 0:
        return 'straight';
      case 1:
        return 'slight_right';
      case 2:
        return 'right';
      case 3:
        return 'sharp_right';
      case 4:
        return 'generic';
      case 5:
        return 'generic';
      case 6:
        return 'generic';
      case 7:
        return 'slight_right';
      case 8:
        return 'u_turn';
      default:
        return 'generic';
    }
  }
}
